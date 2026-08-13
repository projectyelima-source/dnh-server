import { IsOptional, IsString } from 'class-validator';

export class UssdSessionDto {
	@IsString()
	sessionId: string;

	@IsString()
	serviceCode: string;

	@IsString()
	phoneNumber: string;

	@IsString()
	networkCode: string;

	@IsOptional()
	@IsString()
	text?: string;
}
