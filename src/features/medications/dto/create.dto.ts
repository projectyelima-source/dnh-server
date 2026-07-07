import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { MedicationDto } from './medication.dto';

export class CreateMedicationDto extends PickType(MedicationDto, [
	'name',
	'dosage',
	'notes',
	'morning',
	'afternoon',
	'evening',
]) {}

export class UpsertMedicationDto {}

export class MedicationNotificationChoiceDto {
	@ApiProperty({ example: 'yes', enum: ['yes', 'no'] })
	@IsNotEmpty()
	@IsEnum(['yes', 'no'])
	choice: 'yes' | 'no';
}
