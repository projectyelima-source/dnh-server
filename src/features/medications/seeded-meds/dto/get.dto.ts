import { IntersectionType, PickType } from '@nestjs/swagger';
import { GenericResponseDto } from '@/common/dto';
import { SeededMedDto } from './seeded-meds.dto';

export class GetSeededMedDto extends IntersectionType(
	GenericResponseDto,
	PickType(SeededMedDto, ['name', 'possibleDosages']),
) {}
