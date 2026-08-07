import { SmsDto } from './dto';

export abstract class SmsService {
	/**
	 * send - for sending sms with a given payload.
	 *
	 * @param payload - the payload to send.
	 * @returns Returns nothing
	 * @throws An error if validation of the payload fails.
	 */
	abstract send(payload: SmsDto): Promise<void>;
}
