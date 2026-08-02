import { Controller } from '@nestjs/common';
import { ConcernsService } from './concerns.service';

@Controller('symptoms')
export class ConcernsController {
	constructor(private readonly concernsService: ConcernsService) {}
}
