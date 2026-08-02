import {
	ApiResponseProperty,
	IntersectionType,
	PickType,
} from '@nestjs/swagger';
import { GenericResponseDto, PaginationRequestDto } from '@/common/dto';
import { ConcernDto } from './concern.dto';

export class GetConcernDto extends IntersectionType(
	PickType(ConcernDto, ['concernType', 'description', 'onsetDate', 'resolved']),
	PickType(GenericResponseDto, ['id']),
) {
	@ApiResponseProperty({
		example: 'Symptom',
		enum: ['Symptom', 'Side Effect', 'Mental Health', 'General', 'Other'],
	})
	concernName: string;
}

export class GetSymptomDto extends IntersectionType(
	PickType(ConcernDto, ['description', 'onsetDate']),
	PickType(GenericResponseDto, ['id']),
) {}

export class GetSymptomsQueryDto extends PickType(PaginationRequestDto, [
	'page',
	'pageSize',
]) {}
