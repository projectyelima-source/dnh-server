import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseEntity } from '@/common/entities';

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
export class ChatRoom extends BaseEntity {
	@Prop({
		type: [String],
		required: true,
		description: 'Array of participant user IDs in this 1-on-1 conversation',
	})
	participants: string[];
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
