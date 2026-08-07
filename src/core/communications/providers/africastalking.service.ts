import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AfricasTalking from 'africastalking';
import { SmsDto } from '../dto';
import { SmsService } from '../sms.service';

@Injectable()
export class AfricasTalkingService implements SmsService {
	private readonly logger = new Logger(AfricasTalkingService.name);

	constructor(private readonly configService: ConfigService) {}

	async send(payload: SmsDto): Promise<void> {
		const recipients = payload.recipient.join(',');

		const sender = this.configService.get<string>('ATSK_SENDER') || '';
		const response = this.africastalkingClient.SMS.send({
			to: recipients,
			from: sender,
			message: payload.message,
		});

		this.logger.log(
			`SMS sent via Africa's Talking: ${JSON.stringify(response)}`,
		);
	}

	private get africastalkingClient() {
		return AfricasTalking({
			apiKey: this.configService.get<string>('ATSK_API_KEY') ?? '',
			username: this.configService.get<string>('ATSK_USERNAME') ?? '',
		});
	}
}
