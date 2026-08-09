import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from '@/common/dto';
import { PersonnelAccountDto } from './personnel-account.dto';

export class GetPersonnelAccountDto extends PersonnelAccountDto {}

export class GetPersonnelAccountsQueryDto extends PickType(
	PaginationRequestDto,
	['page', 'pageSize'],
) {
	@ApiPropertyOptional({
		description: 'Search personnel accounts by email (prefix match)',
		example: 'doctor',
	})
	@IsOptional()
	@IsString()
	search?: string;
}
