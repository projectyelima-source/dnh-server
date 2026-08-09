import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { PersonnelProviders, PersonnelRoles } from './create.dto';

export class LoginPersonnelDto {
	@ApiProperty({
		example: 'email@example.com',
		description: 'Unique username for the pharmacy',
	})
	@IsNotEmpty()
	@IsEmail()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.toLowerCase().trim() : value,
	)
	email: string;

	@ApiProperty({
		example: 'StrongPassword123!',
		description: 'Personnel password',
	})
	@IsString()
	@IsNotEmpty()
	password: string;

	role?: PersonnelRoles;

	provider?: PersonnelProviders;

	providerUserId?: string;
}
