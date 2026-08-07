import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class MailDto {
	@IsEmail()
	@IsNotEmpty()
	recipient: string;

	@IsString()
	@IsNotEmpty()
	subject: string;

	@IsString()
	@IsNotEmpty()
	message: string;
}
