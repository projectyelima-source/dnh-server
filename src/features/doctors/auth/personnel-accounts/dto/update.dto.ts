import { PartialType } from '@nestjs/swagger';
import { CreatePersonnelAccountDto } from './create.dto';

export class UpdatePersonnelAccountDto extends PartialType(
	CreatePersonnelAccountDto,
) {}
