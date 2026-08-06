import { ApiResponseProperty } from '@nestjs/swagger';
import { PersonnelDto } from '../../dto';

export class GetPersonnelDto extends PersonnelDto {
	@ApiResponseProperty({
		example: 0,
	})
	assignedPatientsCount: number;
}

export class LoginPersonnelResponseDto {
	@ApiResponseProperty({ example: '664b7f8e2c2a1e4b8f1d2c3a4' })
	personnelId: string;

	@ApiResponseProperty({ example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' })
	token: string;
}
