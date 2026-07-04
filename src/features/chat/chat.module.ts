import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
	Personnel,
	PersonnelSchema,
} from '@/features/doctors/entities/personnel.entity';
import { AugurNotificationsModule } from '@/features/notifications/notifications.module';
import {
	Patient,
	PatientSchema,
} from '@/features/patients/entities/patient.entity';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatMessage, ChatMessageSchema } from './entities/message.entity';
import { ChatRoom, ChatRoomSchema } from './entities/room.entity';
import { WsAuthVerifier } from './ws-auth.verifier';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: ChatRoom.name, schema: ChatRoomSchema },
			{ name: ChatMessage.name, schema: ChatMessageSchema },
			{ name: Personnel.name, schema: PersonnelSchema },
			{ name: Patient.name, schema: PatientSchema },
		]),
		AugurNotificationsModule,
	],
	controllers: [ChatController],
	providers: [ChatGateway, ChatService, WsAuthVerifier],
	exports: [ChatService],
})
export class ChatModule {}
