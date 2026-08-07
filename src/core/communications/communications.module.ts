import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/adapters/pug.adapter';
import { join } from 'path';
import { CommunicationsService } from './communications.service';
import { EmailService } from './email.service';
import { AfricasTalkingService, NodemailerService } from './providers';
import { SmsService } from './sms.service';

@Global()
@Module({
	imports: [
		MailerModule.forRootAsync({
			useFactory: async () => ({
				transport: {
					host: process.env.EMAIL_HOST,
					secure: true,
					auth: {
						user: process.env.EMAIL_USERNAME,
						pass: process.env.EMAIL_PASSWORD,
					},
				},
				template: {
					dir: join(__dirname, 'templates'),
					adapter: new PugAdapter(),
					options: {
						strict: true,
					},
				},
			}),
		}),
	],
	providers: [
		{
			provide: EmailService,
			useClass: NodemailerService,
		},
		{
			provide: SmsService,
			useClass: AfricasTalkingService,
		},
		CommunicationsService,
	],
	exports: [CommunicationsService],
})
export class CommunicationsModule {}
