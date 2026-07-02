import { Logger } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { MessageType } from './entities/message.entity';
import { WsAuthVerifier } from './ws-auth.verifier';

@WebSocketGateway({
	cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection {
	private logger = new Logger(ChatGateway.name);

	@WebSocketServer()
	server: Server;

	constructor(
		private readonly chatService: ChatService,
		private readonly wsAuthVerifier: WsAuthVerifier,
	) {}

	async handleConnection(client: Socket) {
		try {
			const user = await this.wsAuthVerifier.verify(client);
			client.data.user = user;
			this.logger.log(`Client connected: ${user.id} (${user.role})`);
		} catch (error) {
			this.logger.error('Connection rejected', error);
			client.emit('error', 'Authentication failed');
			client.disconnect(true);
		}
	}

	@SubscribeMessage('joinPrivateChat')
	async handleJoinPrivateChat(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: { recipientId: string },
	) {
		try {
			const userId = client.data.user.id;
			const room = await this.chatService.getOrCreateRoom(
				userId,
				payload.recipientId,
			);
			client.join(room.id);
			client.emit('roomJoined', { roomId: room.id });
		} catch (error) {
			this.logger.error('joinPrivateChat error', error);
			client.emit('error', 'Failed to join chat room');
		}
	}

	@SubscribeMessage('sendMessage')
	async handleSendMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody()
		payload: {
			roomId: string;
			content: string;
			messageType?: MessageType;
			parentMessageId?: string;
		},
	) {
		try {
			const userId = client.data.user.id;
			const savedMsg = await this.chatService.saveMessage(
				userId,
				payload.roomId,
				payload.content,
				payload.messageType ?? MessageType.TEXT,
				payload.parentMessageId,
			);
			this.server.to(payload.roomId).emit('newMessage', savedMsg);
		} catch (error) {
			this.logger.error('sendMessage error', error);
			client.emit('error', 'Failed to send message');
		}
	}

	@SubscribeMessage('typing')
	handleTyping(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: { roomId: string; isTyping: boolean },
	) {
		const userId = client.data.user.id;
		client.to(payload.roomId).emit('userTyping', {
			userId,
			isTyping: payload.isTyping,
		});
	}

	@SubscribeMessage('markRead')
	async handleMarkRead(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: { roomId: string },
	) {
		try {
			const userId = client.data.user.id;
			await this.chatService.markAsRead(payload.roomId, userId);
			this.server
				.to(payload.roomId)
				.emit('messagesRead', { roomId: payload.roomId, readBy: userId });
		} catch (error) {
			this.logger.error('markRead error', error);
			client.emit('error', 'Failed to mark messages as read');
		}
	}
}
