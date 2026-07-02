import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class CreateMessageDto {
	@ApiProperty({
		description: 'Room ID the message belongs to',
		example: '66a1b2c3d4e5f6a7b8c9d0e1',
	})
	@IsString()
	@IsNotEmpty()
	roomId: string;

	@ApiProperty({
		description: 'Message content (text or media URL)',
		example: 'Hello, how are you?',
	})
	@IsString()
	@IsNotEmpty()
	content: string;

	@ApiProperty({
		description: 'Type of the message',
		enum: MessageType,
		example: MessageType.TEXT,
	})
	@IsEnum(MessageType)
	@IsNotEmpty()
	messageType: MessageType;

	@ApiPropertyOptional({
		description: 'ID of the parent message this is replying to',
		example: '66a1b2c3d4e5f6a7b8c9d0e2',
	})
	@IsOptional()
	@IsString()
	parentMessageId?: string;
}
