import { MailDto } from './dto';

export abstract class EmailService {
	/**
	 * send - for sending emails with a given payload.
	 *
	 * @param payload - the payload to send.
	 * @returns Returns nothing
	 * @throws An error if validation of the payload fails.
	 */
	abstract send(payload: MailDto): void;
}
