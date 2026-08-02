import { PartialType } from '@nestjs/swagger';
import { AddSymptomsDto } from './create.dto';

export class UpdateConcernDto extends PartialType(AddSymptomsDto) {}
