import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, Min } from 'class-validator';

export class PaginatedMessagesDto {
	@ApiProperty({
		description: 'Room ID to fetch messages for',
		example: '66a1b2c3d4e5f6a7b8c9d0e1',
	})
	@IsString()
	roomId: string;

	@ApiPropertyOptional({
		description: 'Number of messages to fetch (default: 20)',
		example: 20,
	})
	@IsOptional()
	@Type(() => Number)
	@Min(1)
	limit?: number;

	@ApiPropertyOptional({
		description:
			'Cursor ID for pagination (the _id of the oldest fetched message)',
		example: '66a1b2c3d4e5f6a7b8c9d0e1',
	})
	@IsOptional()
	@IsString()
	cursor?: string;
}
