import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateOrReject } from 'class-validator';
import { SmsDto } from '../dto';
import { SmsService } from '../sms.service';

@Injectable()
export class AfricasTalkingService implements SmsService {
	private readonly logger = new Logger(AfricasTalkingService.name);
	private readonly apiKey: string;
	private readonly username: string;
	private readonly sender: string;
	private readonly baseUrl: string;

	constructor(private readonly configService: ConfigService) {
		this.apiKey = this.configService.get<string>('ATSK_API_KEY') || '';
		this.username = this.configService.get<string>('ATSK_USERNAME') || '';
		this.sender = this.configService.get<string>('ATSK_SENDER') || '';

		const isSandbox = this.username.toLowerCase() === 'sandbox';
		this.baseUrl = isSandbox
			? 'https://api.sandbox.africastalking.com'
			: 'https://api.africastalking.com';
	}

	async send(payload: SmsDto): Promise<void> {
		if (!this.apiKey || !this.username) {
			this.logger.error(
				"Africa's Talking API credentials (ATSK_API_KEY, ATSK_USERNAME) are not configured",
			);
			throw new Error('ATSK credentials not configured');
		}

		await validateOrReject(payload);
		const recipients = Array.isArray(payload.recipient)
			? payload.recipient.join(',')
			: payload.recipient;

		const params = new URLSearchParams();
		params.append('username', this.username);
		params.append('message', payload.message);
		params.append('phoneNumbers', recipients);

		if (this.sender) {
			params.append('senderId', this.sender);
		}

		try {
			const response = await fetch(`${this.baseUrl}/version1/messaging/bulk`, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					apiKey: this.apiKey,
				},
				body: params.toString(),
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error(
					`Africa's Talking SMS send failed with status ${response.status}: ${errorText}`,
				);
				throw new Error(
					`Failed to send SMS via Africa's Talking (${response.status})`,
				);
			}

			const data = await response.json();
			this.logger.log(`SMS sent via Africa's Talking: ${JSON.stringify(data)}`);
		} catch (error) {
			this.logger.error(
				`Error sending SMS via Africa's Talking: ${error instanceof Error ? error.message : error}`,
			);
			throw error;
		}
	}
}
