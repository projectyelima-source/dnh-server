import {
	IsEmail,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
} from 'class-validator';

export class MailDto {
	@IsEmail()
	@IsNotEmpty()
	recipient: string;

	@IsString()
	@IsNotEmpty()
	subject: string;

	@IsString()
	@IsOptional()
	message?: string;

	@IsString()
	@IsOptional()
	template?: string;

	@IsObject()
	@IsOptional()
	context?: Record<string, any>;
}
