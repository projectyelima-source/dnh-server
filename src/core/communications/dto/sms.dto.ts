import { IsNotEmpty, IsString } from 'class-validator';

export class SmsDto {
	@IsNotEmpty()
	recipient: string | string[];

	@IsString()
	@IsNotEmpty()
	message: string;
}
