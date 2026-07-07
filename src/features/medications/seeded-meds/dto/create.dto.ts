import { PickType } from '@nestjs/swagger';
import { SeededMedDto } from './seeded-meds.dto';

export class CreateSeededMedDto extends PickType(SeededMedDto, [
	'name',
	'possibleDosages',
]) {}
