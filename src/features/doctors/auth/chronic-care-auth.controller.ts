import {
	Body,
	Controller,
	Get,
	Headers,
	HttpCode,
	HttpStatus,
	Logger,
	Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CustomApiResponse, GetUser } from '@/common/decorators';
import {
	ApiSuccessResponseDto,
	ApiSuccessResponseNoData,
	throwError,
} from '@/common/utils/responses';
import { GenerateOtpDto, VerifyOtpDto } from '@/core/security/otp/dto';
import { ChronicCareAuthService } from './chronic-care-auth.service';
import {
	CreatePersonnelDto,
	GetPersonnelDto,
	LoginPersonnelDto,
	LoginPersonnelResponseDto,
} from './dto';

@ApiTags('Dnh Personnels')
@Controller('personnel/auth')
export class ChronicCareAuthController {
	private logger = new Logger(ChronicCareAuthController.name);
	constructor(private readonly authService: ChronicCareAuthService) {}

	@CustomApiResponse(['updated'], {
		message: 'Personnel signed up successfully',
	})
	@HttpCode(HttpStatus.OK)
	@Post('signup')
	async create(@Body() dto: LoginPersonnelDto) {
		try {
			const response = await this.authService.create(dto);
			return new ApiSuccessResponseDto(
				response,
				HttpStatus.CREATED,
				'Personnel signed up successfully',
			);
		} catch (error) {
			throwError(this.logger, error);
		}
	}

	@CustomApiResponse(['updated'], {
		message: 'Personnel onboarded successfully',
	})
	@HttpCode(HttpStatus.OK)
	@Post('onboard')
	async onboard(@Body() dto: CreatePersonnelDto) {
		try {
			const response = await this.authService.onboard(dto);
			return new ApiSuccessResponseDto(
				response,
				HttpStatus.CREATED,
				'Personnel onboarded successfully',
			);
		} catch (error) {
			throwError(this.logger, error);
		}
	}

	@CustomApiResponse(['success', 'notfound'], {
		type: LoginPersonnelResponseDto,
		message: 'Personnel logged in successfully',
	})
	@HttpCode(HttpStatus.OK)
	@Post('login')
	async update(@Body() dto: LoginPersonnelDto) {
		try {
			const response = await this.authService.login(dto);
			return new ApiSuccessResponseDto(
				response,
				HttpStatus.OK,
				'Personnel logged in successfully',
			);
		} catch (error) {
			throwError(this.logger, error);
		}
	}

	@CustomApiResponse(['success', 'notfound'], {
		type: LoginPersonnelResponseDto,
		message: 'Google log in successful',
	})
	@HttpCode(HttpStatus.OK)
	@Post('login/google')
	async doctorLogin(@Headers('idtoken') idToken: string) {
		try {
			const response = await this.authService.googleAuth({ idToken });
			return new ApiSuccessResponseDto(
				response,
				HttpStatus.OK,
				'Google log in successful',
			);
		} catch (error) {
			throwError(this.logger, error);
		}
	}

	@CustomApiResponse(['successNull', 'notfound'], {
		message: 'OTP sent successfully',
	})
	@HttpCode(HttpStatus.OK)
	@Post('otp/re-send')
	async sendOtp(@Body() dto: GenerateOtpDto) {
		try {
			await this.authService.sendOnboardOtp(dto);
			return new ApiSuccessResponseNoData(
				HttpStatus.OK,
				'OTP sent successfully',
			);
		} catch (error) {
			throwError(this.logger, error);
		}
	}

	@CustomApiResponse(['success', 'notfound'], {
		message: 'OTP verified successfully',
	})
	@HttpCode(HttpStatus.OK)
	@Post('otp/verify')
	async verifyOtp(@Body() dto: VerifyOtpDto) {
		try {
			await this.authService.verifyOnboardOtp(dto);
			return new ApiSuccessResponseNoData(
				HttpStatus.OK,
				'OTP verified successfully',
			);
		} catch (error) {
			throwError(this.logger, error);
		}
	}

	@CustomApiResponse(['success', 'authorizeChronicCare'], {
		type: GetPersonnelDto,
		message: 'Authenticated personnel retrieved successfully',
	})
	@Get('current')
	async findOne(@GetUser('sub') personnelId: string) {
		try {
			const response = await this.authService.findAuthenticated(personnelId);
			return new ApiSuccessResponseDto(
				response,
				HttpStatus.OK,
				'Authenticated personnel retrieved successfully',
			);
		} catch (error) {
			throwError(this.logger, error);
		}
	}
}
