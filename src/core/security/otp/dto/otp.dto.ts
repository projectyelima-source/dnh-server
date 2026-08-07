import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class GenerateOtpDto {
	@ApiProperty({
		example: 'doctor@example.com',
		description: 'Personnel email or phone number used as identifier',
	})
	@IsString()
	@IsNotEmpty()
	identifier: string;

	@IsInt()
	@Min(1)
	@IsOptional()
	ttl?: number;
}

export class VerifyOtpDto {
	@ApiProperty({
		example: 'doctor@example.com',
		description: 'Personnel email or phone number used as identifier',
	})
	@IsString()
	@IsNotEmpty()
	identifier: string;

	@ApiProperty({
		example: 123456,
		description: 'The 6-digit OTP code sent to the personnel',
	})
	@IsInt()
	@IsNotEmpty()
	code: number;
}
