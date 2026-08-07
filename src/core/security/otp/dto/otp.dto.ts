import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class GenerateOtpDto {
	@IsString()
	@IsNotEmpty()
	identifier: string;

	@IsInt()
	@Min(1)
	@IsOptional()
	ttl?: number;
}

export class VerifyOtpDto {
	@IsString()
	@IsNotEmpty()
	identifier: string;

	@IsInt()
	@IsNotEmpty()
	code: number;
}
