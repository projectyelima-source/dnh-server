import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';

class OtherParticipantDto {
	@ApiProperty({ example: 'user_abc123' })
	id: string;

	@ApiProperty({ example: 'Dr. John Doe' })
	name: string;

	@ApiProperty({ example: 'hcp' })
	role: string;
}

class LatestMessageDto {
	@ApiProperty({ example: '66a1b2c3d4e5f6a7b8c9d0e1' })
	id: string;

	@ApiProperty({ example: 'Hello, how are you?' })
	content: string;

	@ApiProperty({ example: 'text' })
	messageType: string;

	@ApiProperty({ example: 'user_abc123' })
	senderId: string;

	@ApiResponseProperty()
	createdAt: Date;
}

export class ChatSessionDto {
	@ApiProperty({ example: '66a1b2c3d4e5f6a7b8c9d0e1' })
	id: string;

	@ApiProperty({ type: OtherParticipantDto })
	otherParticipant: OtherParticipantDto;

	@ApiProperty({ type: LatestMessageDto, nullable: true })
	latestMessage: LatestMessageDto | null;
}
