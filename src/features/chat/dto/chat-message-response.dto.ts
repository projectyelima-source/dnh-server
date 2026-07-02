import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageResponseDto {
	@ApiProperty({ example: '66a1b2c3d4e5f6a7b8c9d0e1' })
	id: string;

	@ApiProperty({ example: 'user_abc123' })
	senderId: string;

	@ApiProperty({ example: '66a1b2c3d4e5f6a7b8c9d0e1' })
	roomId: string;

	@ApiProperty({ example: 'text', enum: ['text', 'image', 'video', 'audio'] })
	messageType: string;

	@ApiProperty({ example: 'Hello, how are you?' })
	content: string;

	@ApiProperty({ example: false })
	isRead: boolean;

	@ApiPropertyOptional({
		type: 'object',
		properties: {
			id: { type: 'string' },
			content: { type: 'string' },
			senderId: { type: 'string' },
			messageType: { type: 'string' },
		},
	})
	parentMessageId?: Record<string, any> | null;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;
}
