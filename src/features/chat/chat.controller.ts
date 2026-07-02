import * as crypto from 'node:crypto';
import {
	Controller,
	Get,
	HttpStatus,
	Logger,
	Param,
	ParseFilePipeBuilder,
	Post,
	Query,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CustomApiResponse, GetUser } from '@/common/decorators';
import { ParseMongoIdPipe } from '@/common/decorators/validators/pipes';
import { ApiSuccessResponseDto, throwError } from '@/common/utils/responses';
import { FirebaseService } from '@/core/firebase/firebase.service';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatMessageResponseDto, ChatSessionDto } from './dto';
import { MessageType } from './entities/message.entity';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
	private logger = new Logger(ChatController.name);
	private storageBucket: string;

	constructor(
		private readonly chatService: ChatService,
		private readonly firebaseService: FirebaseService,
		private readonly chatGateway: ChatGateway,
		private readonly configService: ConfigService,
	) {
		this.storageBucket = this.configService.get<string>('BASE_STORAGE_BUCKET')!;
	}

	@CustomApiResponse(['created', 'authorizeChronicCare'], {
		type: ChatMessageResponseDto,
		message: 'Media uploaded successfully',
	})
	@Post('hcp/rooms/:roomId/media')
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Media file to upload',
		schema: {
			type: 'object',
			properties: {
				file: { type: 'string', format: 'binary' },
				parentMessageId: { type: 'string' },
			},
		},
	})
	@UseInterceptors(FileInterceptor('file'))
	async uploadMedia(
		@Param('roomId') roomId: string,
		@UploadedFile(
			new ParseFilePipeBuilder()
				.addMaxSizeValidator({ maxSize: 50 * 1024 * 1024 })
				.addFileTypeValidator({
					fileType: /(jpeg|jpg|png|gif|mp4|mpeg|m4a|mp3|quicktime|webm)$/i,
				})
				.build(),
		)
		file: Express.Multer.File,
		@Query('parentMessageId') parentMessageId?: string,
	) {
		try {
			return await this.handleMediaUpload(file, roomId, parentMessageId);
		} catch (error) {
			throwError(this.logger, error);
		}
	}

	@CustomApiResponse(['created', 'authorize'], {
		type: ChatMessageResponseDto,
		message: 'Media uploaded successfully',
	})
	@Post('client/rooms/:roomId/media')
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Media file to upload',
		schema: {
			type: 'object',
			properties: {
				file: { type: 'string', format: 'binary' },
				parentMessageId: { type: 'string' },
			},
		},
	})
	@UseInterceptors(FileInterceptor('file'))
	async uploadMediaClient(
		@Param('roomId') roomId: string,
		@UploadedFile(
			new ParseFilePipeBuilder()
				.addMaxSizeValidator({ maxSize: 50 * 1024 * 1024 })
				.addFileTypeValidator({
					fileType: /(jpeg|jpg|png|gif|mp4|mpeg|m4a|mp3|quicktime|webm)$/i,
				})
				.build(),
		)
		file: Express.Multer.File,
		@Query('parentMessageId') parentMessageId?: string,
	) {
		try {
			return await this.handleMediaUpload(file, roomId, parentMessageId);
		} catch (error) {
			throwError(this.logger, error);
		}
	}

	@CustomApiResponse(['success', 'authorizeChronicCare'], {
		type: ChatMessageResponseDto,
		isArray: true,
		message: 'Messages fetched successfully',
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Number of messages to fetch (default: 20)',
	})
	@ApiQuery({
		name: 'cursor',
		required: false,
		type: String,
		description:
			'Cursor ID for pagination (the _id of the oldest fetched message)',
	})
	@Get('hcp/rooms/:roomId/messages')
	async getHistory(
		@Param('roomId', ParseMongoIdPipe) roomId: string,
		@Query('limit') limit?: number,
		@Query('cursor') cursor?: string,
	) {
		try {
			const messages = await this.chatService.getPaginatedMessages(
				roomId,
				limit ?? 20,
				cursor,
			);
			return new ApiSuccessResponseDto(
				messages,
				HttpStatus.OK,
				'Messages fetched successfully',
			);
		} catch (error) {
			throwError(this.logger, error);
		}
	}

	@CustomApiResponse(['success', 'authorize'], {
		type: ChatMessageResponseDto,
		isArray: true,
		message: 'Messages fetched successfully',
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Number of messages to fetch (default: 20)',
	})
	@ApiQuery({
		name: 'cursor',
		required: false,
		type: String,
		description:
			'Cursor ID for pagination (the _id of the oldest fetched message)',
	})
	@Get('client/rooms/:roomId/messages')
	async getHistoryClient(
		@Param('roomId', ParseMongoIdPipe) roomId: string,
		@Query('limit') limit?: number,
		@Query('cursor') cursor?: string,
	) {
		try {
			const messages = await this.chatService.getPaginatedMessages(
				roomId,
				limit ?? 20,
				cursor,
			);
			return new ApiSuccessResponseDto(
				messages,
				HttpStatus.OK,
				'Messages fetched successfully',
			);
		} catch (error) {
			throwError(this.logger, error);
		}
	}

	@CustomApiResponse(['success', 'authorizeChronicCare'], {
		type: ChatSessionDto,
		isArray: true,
		message: 'Chat sessions fetched successfully',
	})
	@Get('hcp/sessions')
	async getHcpSessions(@GetUser('sub', ParseMongoIdPipe) personnelId: string) {
		try {
			const sessions = await this.chatService.listUserSessions(
				personnelId,
				'hcp',
			);
			return new ApiSuccessResponseDto(
				sessions,
				HttpStatus.OK,
				'Chat sessions fetched successfully',
			);
		} catch (error) {
			throwError(this.logger, error);
		}
	}

	@CustomApiResponse(['success', 'authorize'], {
		type: ChatSessionDto,
		isArray: true,
		message: 'Chat sessions fetched successfully',
	})
	@Get('client/sessions')
	async getClientSessions(@GetUser('uid') patientId: string) {
		try {
			const sessions = await this.chatService.listUserSessions(
				patientId,
				'patient',
			);
			return new ApiSuccessResponseDto(
				sessions,
				HttpStatus.OK,
				'Chat sessions fetched successfully',
			);
		} catch (error) {
			throwError(this.logger, error);
		}
	}

	private async handleMediaUpload(
		file: Express.Multer.File,
		roomId: string,
		parentMessageId?: string,
	) {
		const uuidToken = crypto.randomUUID();
		const mime = file.mimetype;

		let folder: string;
		let messageType: MessageType;

		if (mime.startsWith('image/')) {
			folder = 'images';
			messageType = MessageType.IMAGE;
		} else if (mime.startsWith('video/')) {
			folder = 'videos';
			messageType = MessageType.VIDEO;
		} else {
			folder = 'audios';
			messageType = MessageType.AUDIO;
		}

		const storagePath = `hcp_chats/${roomId}/${folder}`;

		await this.firebaseService.uploadFile(file, storagePath, uuidToken);

		const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${this.storageBucket}/o/${encodeURIComponent(storagePath + '/' + file.originalname)}?alt=media&token=${uuidToken}`;

		const savedMsg = await this.chatService.saveMessage(
			'system',
			roomId,
			fileUrl,
			messageType,
			parentMessageId,
		);

		this.chatGateway.server.to(roomId).emit('newMessage', savedMsg);

		return new ApiSuccessResponseDto(
			savedMsg,
			HttpStatus.CREATED,
			'Media uploaded successfully',
		);
	}
}
