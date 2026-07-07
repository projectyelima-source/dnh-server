import { PartialType } from '@nestjs/swagger';
import { CreateSeededMedDto } from './create.dto';

export class UpdateSeededMedDto extends PartialType(CreateSeededMedDto) {}
