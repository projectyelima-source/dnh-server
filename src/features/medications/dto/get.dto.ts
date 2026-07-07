import { IntersectionType, PickType } from '@nestjs/swagger';
import { GenericResponseDto } from '@/common/dto';
import { MedicationDto } from './medication.dto';

export class GetMedicationDto extends IntersectionType(
	PickType(MedicationDto, [
		'name',
		'quantity',
		'quantityUnit',
		'refillReminder',
		'dosage',
		'frequency',
		'prescribedBy',
	]),
	PickType(GenericResponseDto, ['id']),
) {}

export class MedicationDetailDto extends IntersectionType(
	PickType(MedicationDto, [
		'name',
		'dosage',
		'notes',
		'morning',
		'afternoon',
		'evening',
	]),
	GenericResponseDto,
) {}
