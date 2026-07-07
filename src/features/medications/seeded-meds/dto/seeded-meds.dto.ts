import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SeededMedDto {
	@ApiProperty({
		description: 'Medication name',
		example: 'Paracetamol',
	})
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({
		description: 'Possible dosages for this medication',
		example: ['500mg', '1000mg'],
		type: [String],
	})
	@IsArray()
	@IsString({ each: true })
	possibleDosages: string[];
}
