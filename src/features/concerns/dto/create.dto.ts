import { PickType } from '@nestjs/swagger';
import { ConcernDto } from './concern.dto';

export const ConcernNameTypeMap: Record<string, string> = {
	symptoms: 'Symptoms',
	sideEffect: 'Side Effect',
	mentalHealth: 'Mental Health',
	general: 'General',
	other: 'Other',
};

export class CreateConcernDto {}

export class AddSymptomsDto extends PickType(ConcernDto, ['description']) {}
