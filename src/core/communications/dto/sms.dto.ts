import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SmsDto {
	@IsNotEmpty()
	@IsArray()
	@IsString({ each: true })
	recipient: string[];

	@IsString()
	@IsNotEmpty()
	message: string;
}
