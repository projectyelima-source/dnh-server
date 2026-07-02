import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Personnel } from '@/features/doctors/entities/personnel.entity';
import { Patient } from '@/features/patients/entities/patient.entity';
import { ChatMessage, MessageType } from './entities/message.entity';
import { ChatRoom } from './entities/room.entity';

@Injectable()
export class ChatService {
	constructor(
		@InjectModel(ChatRoom.name) private roomModel: Model<ChatRoom>,
		@InjectModel(ChatMessage.name) private messageModel: Model<ChatMessage>,
		@InjectModel(Personnel.name) private personnelModel: Model<Personnel>,
		@InjectModel(Patient.name) private patientModel: Model<Patient>,
	) {}

	async getOrCreateRoom(userA: string, userB: string) {
		let room = await this.roomModel.findOne({
			participants: { $all: [userA, userB], $size: 2 },
		});

		if (!room) {
			room = await this.roomModel.create({
				participants: [userA, userB],
			});
		}

		return room;
	}

	async saveMessage(
		senderId: string,
		roomId: string,
		content: string,
		messageType: MessageType,
		parentMessageId?: string,
	) {
		const payload: Record<string, any> = {
			senderId,
			roomId,
			content,
			messageType,
			isRead: false,
		};

		if (parentMessageId) {
			payload.parentMessageId = new Types.ObjectId(parentMessageId);
		}

		const message = await this.messageModel.create(payload);

		if (parentMessageId) {
			return message.populate({
				path: 'parentMessageId',
				select: 'content senderId messageType',
			});
		}

		return message;
	}

	async markAsRead(roomId: string, userId: string) {
		await this.messageModel.updateMany(
			{ roomId, senderId: { $ne: userId }, isRead: false },
			{ $set: { isRead: true } },
		);
	}

	async getPaginatedMessages(roomId: string, limit = 20, cursor?: string) {
		const filter: Record<string, any> = { roomId };

		if (cursor) {
			filter._id = { $lt: new Types.ObjectId(cursor) };
		}

		const messages = await this.messageModel
			.find(filter)
			.sort({ _id: -1 })
			.limit(limit)
			.populate({
				path: 'parentMessageId',
				select: 'content senderId messageType',
			})
			.lean();

		return messages.reverse();
	}

	async findRoomById(roomId: string) {
		const room = await this.roomModel.findById(roomId);
		if (!room) {
			throw new NotFoundException('Room not found');
		}
		return room;
	}

	async listUserSessions(
		userId: string,
		userRole: 'patient' | 'hcp',
	): Promise<
		{
			id: string;
			otherParticipant: { id: string; name: string; role: string };
			latestMessage: {
				id: string;
				content: string;
				messageType: string;
				senderId: string;
				createdAt: Date;
			} | null;
		}[]
	> {
		const rooms = await this.roomModel
			.find({ participants: userId })
			.sort({ updatedAt: -1 })
			.lean();

		const sessions = await Promise.all(
			rooms.map(async (room) => {
				const otherId = room.participants.find((id) => id !== userId)!;

				let name: string;
				let otherRole: string;

				if (userRole === 'patient') {
					const personnel = await this.personnelModel
						.findById(otherId)
						.select('userName')
						.lean();
					name = personnel?.userName ?? 'Unknown';
					otherRole = 'hcp';
				} else {
					const patient = await this.patientModel
						.findOne({ userId: otherId })
						.select('name')
						.lean();
					name = patient?.name ?? 'Unknown';
					otherRole = 'patient';
				}

				const latestMessage = await this.messageModel
					.findOne({ roomId: room._id.toString() })
					.sort({ _id: -1 })
					.select('content messageType senderId createdAt')
					.lean();

				const plainId = (room as any)._id?.toString();

				return {
					id: plainId,
					otherParticipant: {
						id: otherId,
						name,
						role: otherRole,
					},
					latestMessage: latestMessage
						? {
								id: (latestMessage as any)._id?.toString(),
								content: latestMessage.content,
								messageType: latestMessage.messageType,
								senderId: latestMessage.senderId,
								createdAt: latestMessage.createdAt,
							}
						: null,
				};
			}),
		);

		return sessions;
	}
}
