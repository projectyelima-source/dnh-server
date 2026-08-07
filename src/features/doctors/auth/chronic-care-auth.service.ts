import {
	BadRequestException,
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

@Injectable()
export class ChronicCareAuthService {
	constructor(
		@InjectModel(Personnel.name) private personnelModel: Model<Personnel>,
		private authService: AuthService,
		private readonly otpService: OtpService,
		private readonly communicationsService: CommunicationsService,
	) {}

	async create(dto: LoginPersonnelDto) {
		const personnel = await this.personnelModel.create({
			email: dto.email,
			password: dto.password,
			role: PersonnelRoles.CLINICIAN,
		});

		return personnel._id;
	}

	async onboard(dto: CreatePersonnelDto) {
		const personnel = await this.personnelModel.findByIdAndUpdate(
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
		);

		if (!personnel) {
			throw new NotFoundException('Personnel not found');
		}

		const code = await this.otpService.generate({
			identifier: `${personnel.email}`,
		});

		this.sendVerificationCodeMail({
			mail: personnel.email,
			fullName: personnel.userName,
			code: code,
			phoneNumber: personnel.phoneNumber,
		});
		return personnel?._id;
	}

	async login(dto: LoginPersonnelDto) {
		const orQuery: object[] = [{ email: dto.email }];

		if (dto.providerUserId) {
			orQuery.push({ providerUserId: dto.providerUserId });
		}

		const personnel = await this.personnelModel.findOne({ $or: orQuery });
		if (!personnel) {
			throw new UnauthorizedException('Invalid credentials');
		}

		if (!personnel.isVerified) {
			throw new UnauthorizedException('Personnel not verified');
		}

		const passwordMatch = await bcrypt.compare(
			dto.password,
			personnel.password,
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
				email: personnel.email,
				facility: personnel.facility?.toString(),
			},
		);

		return { personnelId: personnel._id.toString(), token };
	}

	async googleAuth(dto: GoogleLoginDto) {
		const payload = await this.authService.googleLogin(dto.idToken);
		const { email, sub: googleId } = payload;

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
		const personnel = await this.personnelModel.findOne({
			$or: [{ email: dto.identifier }, { phoneNumber: dto.identifier }],
		});
		if (!personnel) {
			throw new NotFoundException('Personnel not found');
		}
		if (personnel.isVerified) {
			throw new BadRequestException('Personnel already verified');
		}

		const code = await this.otpService.generate({
			identifier: `${personnel.email}`,
		});

		this.sendVerificationCodeMail({
			mail: personnel.email,
			fullName: personnel.userName,
			code: code,
			phoneNumber: personnel.phoneNumber,
		});
	}

	async verifyOnboardOtp(dto: VerifyOtpDto) {
		const personnel = await this.personnelModel.findOne({
			$or: [{ email: dto.identifier }, { phoneNumber: dto.identifier }],
		});

		if (!personnel) {
			throw new NotFoundException('Personnel not found');
		}

		const identifier = `${personnel.email}`;
		const isValid = await this.otpService.verify({
			identifier,
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
