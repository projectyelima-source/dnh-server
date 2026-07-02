import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadMediaDto {
	@ApiProperty({
		description: 'Room ID the media belongs to',
		example: '66a1b2c3d4e5f6a7b8c9d0e1',
	})
	@IsString()
	roomId: string;

	@ApiPropertyOptional({
		description:
			'ID of the parent message this media is replying to (optional)',
		example: '66a1b2c3d4e5f6a7b8c9d0e2',
	})
	@IsOptional()
	@IsString()
	parentMessageId?: string;
}
