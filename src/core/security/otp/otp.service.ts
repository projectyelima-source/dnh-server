import * as crypto from 'node:crypto';
import { createClient, RedisClientType } from '@keyv/redis';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { CacheService } from '../../caching/caching.service';
import { GenerateOtpDto, VerifyOtpDto } from './dto';

@Injectable()
export class OtpService {
	private readonly logger = new Logger(OtpService.name);
	private readonly defaultTtl: number;
	private readonly redisUrl: string;

	constructor(
		private readonly cacheService: CacheService<string>,
		private readonly configService: ConfigService,
	) {
		// Default TTL in ms (10 minutes = 600,000 ms)
		this.defaultTtl = this.configService.get<number>('OTP_TTL')
			? Number(this.configService.get<number>('OTP_TTL'))
			: 10 * 60 * 1000;
		this.redisUrl = this.configService.get<string>('REDIS_URL') || '';
	}

	async generate(payload: GenerateOtpDto): Promise<number> {
		const otp = crypto.randomInt(100000, 1000000);
		const hashedOtp = await bcrypt.hash(otp.toString(), 10);
		const cacheKey = `otp:${payload.identifier}`;
		const ttl = payload.ttl ?? this.defaultTtl;

		await this.cacheService.set(cacheKey, hashedOtp, ttl);
		return otp;
	}

	async verify(payload: VerifyOtpDto): Promise<boolean> {
		const pattern = `otp:${payload.identifier}`;
		const matches = await this.getValuesByPattern(pattern);

		if (!matches.length) {
			return false;
		}

		let isValid = false;
		for (const { key, value } of matches) {
			if (value) {
				const match = await bcrypt.compare(payload.code.toString(), value);
				if (match) {
					isValid = true;
				}
			}
			await this.cacheService.delete(key);
		}

		return isValid;
	}

	private async getValuesByPattern(
		pattern: string,
	): Promise<Array<{ key: string; value: string | null }>> {
		if (!this.redisUrl) {
			const value = await this.cacheService.get(pattern);
			return [{ key: pattern, value }];
		}

		const client: RedisClientType = createClient({
			url: this.redisUrl,
		});

		const results: Array<{ key: string; value: string | null }> = [];

		try {
			await client.connect();
			let cursor = '0';

			do {
				const { cursor: nextCursor, keys } = await client.scan(cursor, {
					MATCH: pattern,
					COUNT: 100,
				});

				cursor = nextCursor;

				for (const key of keys) {
					const val = await this.cacheService.get(key);
					results.push({ key, value: val });
				}
			} while (cursor !== '0');
		} catch (error) {
			this.logger.error(
				`Error fetching keys by pattern "${pattern}": ${error instanceof Error ? error.message : error}`,
			);
			const value = await this.cacheService.get(pattern);
			return [{ key: pattern, value }];
		} finally {
			await client.quit();
		}

		return results;
	}
}
