import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from '@/common/dto';
import { FacilityDto } from './facility.dto';

export class GetFacilityDto extends FacilityDto {}

export class GetFacilitiesQueryDto extends PickType(PaginationRequestDto, [
	'page',
	'pageSize',
]) {
	@ApiPropertyOptional({
		description: 'Search facilities by name (prefix match)',
		example: 'Korle',
	})
	@IsOptional()
	@IsString()
	search?: string;
}
