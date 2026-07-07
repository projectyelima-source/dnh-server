import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { PatientDto } from './patient.dto';

export class CreatePatientDto extends PickType(PatientDto, [
	'patientCode',
	'userId',
	'name',
	'dateOfBirth',
	'gender',
	'timezone',
]) {
	chronicConditions: string[];

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
