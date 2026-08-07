import { Injectable } from '@nestjs/common';
import { MailDto, SmsDto } from './dto';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Injectable()
export class CommunicationsService {
	constructor(
		private readonly emailService: EmailService,
		private readonly smsService: SmsService,
	) {}

	sendMail(payload: MailDto) {
		this.emailService.send(payload);
	}

	sendSms(payload: SmsDto) {
		this.smsService.send(payload);
	}
}
