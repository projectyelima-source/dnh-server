import { ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsMongoId, IsOptional, IsString } from 'class-validator';
import { GenericResponseDto } from '@/common/dto';
import { PersonnelDto } from '@/features/doctors/dto';

export class PersonnelAccountDto extends GenericResponseDto {
	@ApiPropertyOptional({
		example: 'email',
		description: 'The SSO authentication provider',
	})
	@IsOptional()
	@IsString()
	provider?: string;

	@ApiPropertyOptional({
		example: 'google-sub-id',
		description: 'The SSO authentication provider user id',
	})
	@IsOptional()
	@IsString()
	providerUserId?: string;

	@ApiPropertyOptional({
		example: 'doctor@example.com',
		description: "The user's email address",
	})
	@IsOptional()
	@IsEmail()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.toLowerCase().trim() : value,
	)
	email?: string;

	@ApiPropertyOptional({
		example: 'StrongPassword123!',
		description: 'The hashed password for authentication',
	})
	@IsOptional()
	@IsString()
	password?: string;

	@ApiResponseProperty({
		type: () => PersonnelDto,
	})
	@IsMongoId()
	personnel: PersonnelDto;
}
