import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
	IsDateString,
	IsMongoId,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import { PatientDto } from './patient.dto';

export class CreatePatientDto extends PickType(PatientDto, [
	'patientCode',
	'userId',
	'name',
	'gender',
	'timezone',
]) {
	chronicConditions: string[];

	@ApiPropertyOptional({
		description: 'Date of birth of the patient in MM/DD/YYYY format',
		example: '01/01/1963',
	})
	@IsOptional()
	@IsDateString()
	dateOfBirth?: Date;

	@ApiPropertyOptional({
		description: 'Age of the patient in years',
		example: 35,
	})
	@IsOptional()
	@IsNumber()
	@Min(0)
	age?: number;

	@ApiPropertyOptional({
		description:
			'Facility ID (MongoDB ObjectId) to associate with this patient',
		example: '664b7f8e2c2a1e4b8f1d2c3a4',
		name: 'facilityId',
	})
	@IsOptional()
	@IsString()
	@IsMongoId()
	@Expose({ name: 'facilityId' })
	facility?: string;
}
