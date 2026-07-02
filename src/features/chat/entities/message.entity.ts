import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import { BaseEntity } from '@/common/entities';

export enum MessageType {
	TEXT = 'text',
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
}

@Schema({
	timestamps: true,
	toJSON: {
		transform: (_doc, ret: any) => {
			const id = ret._id;
			delete ret._id;
			delete ret.__v;
			return { id, ...ret };
		},
	},
})
export class ChatMessage extends BaseEntity {
	@Prop({
		required: true,
		description: 'User ID of the message sender',
	})
	senderId: string;

	@Prop({
		required: true,
		index: true,
		description: 'Room ID this message belongs to',
	})
	roomId: string;

	@Prop({
		required: true,
		enum: MessageType,
		description: 'Type of the message (text, image, video, audio)',
	})
	messageType: MessageType;

	@Prop({
		required: true,
		description: 'Message content (text or media URL)',
	})
	content: string;

	@Prop({
		default: false,
		description: 'Whether the message has been read by the recipient',
	})
	isRead: boolean;

	@Prop({
		type: ObjectId,
		ref: 'ChatMessage',
		description:
			'ID of the parent message this is replying to (null if not a reply)',
	})
	parentMessageId: Types.ObjectId | null;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

ChatMessageSchema.index({ roomId: 1, _id: -1 });
