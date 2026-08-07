import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { validateOrReject } from 'class-validator';
import { MailDto } from '../dto';

@Injectable()
export class NodemailerService {
	constructor(
		private readonly mailService: MailerService,
		private readonly configService: ConfigService,
	) {}

	async send(payload: MailDto) {
		await validateOrReject(payload);
		this.mailService.sendMail({
			from: this.configService.get<string>('EMAIL_FROM'),
			to: payload.recipient,
			subject: payload.subject,
			text: payload.message,
		});
	}
}
