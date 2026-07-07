import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateMedicationDto } from './create.dto';

export class UpdateMedicationDto extends PartialType(
	OmitType(CreateMedicationDto, ['name']),
) {}
