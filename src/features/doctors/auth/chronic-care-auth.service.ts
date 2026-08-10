import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { AuthService } from '@/core/auth/auth.service';
import { GoogleLoginDto } from '@/core/auth/dto';
import { UserType } from '@/core/auth/enums';
import { CommunicationsService } from '@/core/communications/communications.service';
import { GenerateOtpDto, VerifyOtpDto } from '@/core/security/otp/dto';
import { OtpService } from '@/core/security/otp/otp.service';
import { Personnel } from '../entities/personnel.entity';
import {
	CreatePersonnelDto,
	LoginPersonnelDto,
	PersonnelProviders,
	PersonnelRoles,
} from './dto';
import { PersonnelAccount } from './personnel-accounts/entities/personnel-account.entity';

@Injectable()
export class ChronicCareAuthService {
	constructor(
		@InjectModel(Personnel.name) private personnelModel: Model<Personnel>,
		@InjectModel(PersonnelAccount.name)
		private personnelAccountModel: Model<PersonnelAccount>,
		private authService: AuthService,
		private readonly otpService: OtpService,
		private readonly communicationsService: CommunicationsService,
	) {}

	async create(dto: LoginPersonnelDto) {
		const existingAccount = await this.personnelAccountModel.findOne({
			email: dto.email,
		});

		let personnelId: any = existingAccount?.personnel;

		if (!personnelId) {
			const personnel = await this.personnelModel.create({
				role: PersonnelRoles.CLINICIAN,
			});
			personnelId = personnel._id;
		}

		const personnelAccount = await this.personnelAccountModel.create({
			provider: dto.provider || PersonnelProviders.EMAIL,
			providerUserId: dto.providerUserId,
			email: dto.email,
			password: dto.password,
			personnel: personnelId,
		});

		await this.personnelModel.findByIdAndUpdate(personnelId, {
			$push: { personnelAccounts: personnelAccount._id },
		});

		return personnelId;
	}

	async onboard(dto: CreatePersonnelDto) {
		const personnel = await this.personnelModel
			.findByIdAndUpdate(
				dto.personnelId,
				{
					$set: {
						userName: `${dto.firstname ?? ''} ${dto.lastname ?? ''}`.trim(),
						phoneNumber: dto.phoneNumber,
						personnelIdNumber: dto.personnelIdNumber,
						facility: dto.facility,
						...(dto.role !== undefined && { role: dto.role }),
					},
				},
				{ new: true },
			)
			.populate({
				path: 'personnelAccounts',
				select: 'email',
			});

		if (!personnel) {
			throw new NotFoundException('Personnel not found');
		}

		const email = (personnel.personnelAccounts as any)?.[0]?.email;

		if (personnel.role === PersonnelRoles.CLINICIAN) {
			const code = await this.otpService.generate({
				identifier: `${email}`,
			});

			this.sendVerificationCodeMail({
				mail: email,
				fullName: personnel.userName,
				code: code,
				phoneNumber: personnel.phoneNumber,
			});
		} else {
			personnel.isVerified = true;
			await personnel.save();
		}
		return personnel?._id;
	}

	async login(dto: LoginPersonnelDto) {
		const orQuery: object[] = [{ email: dto.email }];

		if (dto.providerUserId) {
			orQuery.push({ providerUserId: dto.providerUserId });
		}

		const personnelAccount = await this.personnelAccountModel
			.findOne({
				$and: orQuery,
			})
			.populate({
				path: 'personnel',
				select: 'isVerified role facility',
			});

		if (!personnelAccount) {
			const existingAccount = await this.personnelAccountModel.findOne({
				email: dto.email,
				provider: PersonnelProviders.EMAIL,
			});
			if (existingAccount) {
				throw new ConflictException('Account with this email already exists');
			}
			throw new UnauthorizedException('Invalid credentials');
		}

		const personnel = personnelAccount.personnel as any;

		if (!personnel?.isVerified) {
			throw new UnauthorizedException('Personnel not verified');
		}

		const passwordMatch = await bcrypt.compare(
			dto.password,
			personnelAccount.password,
		);
		if (!passwordMatch) {
			throw new UnauthorizedException('Invalid credentials');
		}
		const token = await this.authService.signToken(
			personnel._id.toString(),
			{
				audience: UserType.CHRONIC_CARE.toString(),
			},
			{
				role: personnel.role as PersonnelRoles,
				email: personnelAccount.email,
				facility: personnel.facility?.toString(),
			},
		);

		return { personnelId: personnel._id.toString(), token };
	}

	async googleAuth(dto: GoogleLoginDto) {
		const payload = await this.authService.googleLogin(dto.idToken);
		const { email, sub: googleId, email_verified: isVerified } = payload;
		if (!isVerified) {
			throw new ConflictException('Email not verified');
		}
		try {
			return await this.login({
				email: email!,
				providerUserId: googleId,
				password: email || googleId,
			});
		} catch (error) {
			if (
				error instanceof UnauthorizedException ||
				error instanceof NotFoundException
			) {
				const personnelId = await this.create({
					email: email!,
					provider: PersonnelProviders.GOOGLE,
					role: PersonnelRoles.CLINICIAN,
					providerUserId: googleId,
					password: email || googleId,
				});
				const token = await this.authService.signToken(
					personnelId.toString(),
					{
						audience: UserType.CHRONIC_CARE.toString(),
					},
					{
						role: PersonnelRoles.CLINICIAN,
						email: email!,
					},
				);

				return { personnelId: personnelId.toString(), token };
			}
			throw error;
		}
	}

	async findAuthenticated(id: string) {
		const personnel = await this.personnelModel
			.findById(id)
			.select('-password')
			.populate({ path: 'facility', select: 'name' });
		if (!personnel) {
			throw new NotFoundException('Personnel not found');
		}
		const json = personnel.toJSON() as any;
		json.assignedPatientsCount = 0;
		return json;
	}

	async sendOnboardOtp(dto: GenerateOtpDto) {
		let email: string | undefined;
		let personnel: any;

		const account = await this.personnelAccountModel
			.findOne({ email: dto.identifier })
			.populate({ path: 'personnel' });

		if (account) {
			email = account.email;
			personnel = account.personnel;
		} else {
			personnel = await this.personnelModel
				.findOne({ phoneNumber: dto.identifier })
				.populate({ path: 'personnelAccounts', select: 'email' });
			email = personnel?.personnelAccounts?.[0]?.email;
		}

		if (!personnel || !email) {
			throw new NotFoundException('Personnel not found');
		}

		if (personnel.isVerified) {
			throw new BadRequestException('Personnel already verified');
		}

		const code = await this.otpService.generate({
			identifier: `${email}`,
		});

		this.sendVerificationCodeMail({
			mail: email,
			fullName: personnel.userName,
			code: code,
			phoneNumber: personnel.phoneNumber,
		});
	}

	async verifyOnboardOtp(dto: VerifyOtpDto) {
		let email: string | undefined;
		let personnel: any;

		const account = await this.personnelAccountModel
			.findOne({ email: dto.identifier })
			.populate({ path: 'personnel' });

		if (account) {
			email = account.email;
			personnel = account.personnel;
		} else {
			personnel = await this.personnelModel
				.findOne({ phoneNumber: dto.identifier })
				.populate({ path: 'personnelAccounts', select: 'email' });
			email = personnel?.personnelAccounts?.[0]?.email;
		}

		if (!personnel || !email) {
			throw new NotFoundException('Personnel not found');
		}

		const isValid = await this.otpService.verify({
			identifier: email,
			code: dto.code,
		});

		if (!isValid) {
			throw new BadRequestException('Invalid or expired OTP');
		}

		personnel.isVerified = true;
		await personnel.save();
	}

	private sendVerificationCodeMail(payload: {
		mail: string;
		fullName: string;
		code: number;
		phoneNumber?: string;
	}) {
		const { mail, fullName, code, phoneNumber } = payload;
		const emailPayload = {
			recipient: mail,
			subject: 'Email OTP - Yelima',
			template: './emailVerificationCode',
			context: {
				fullName,
				code,
				email: mail,
				ttl: '10 minutes',
			},
		};

		this.communicationsService.sendMail(emailPayload);

		if (phoneNumber) {
			this.communicationsService.sendSms({
				recipient: [phoneNumber],
				message: `Hi ${fullName}, your OTP is ${code}. It is valid for 10 minutes.`,
			});
		}
	}
}
