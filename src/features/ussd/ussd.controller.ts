import { Body, Controller, Header, HttpCode, Post } from '@nestjs/common';
import { UssdSessionDto } from './dto/ussd-session.dto';
import { UssdService } from './ussd.service';

@Controller('ussd')
export class UssdController {
	constructor(private readonly ussdService: UssdService) {}

	@Post()
	@HttpCode(200)
	@Header('Content-Type', 'text/plain')
	async handleSession(@Body() dto: UssdSessionDto): Promise<string> {
		return this.ussdService.handleSession(
			dto.sessionId,
			dto.phoneNumber,
			dto.text ?? '',
		);
	}
}
