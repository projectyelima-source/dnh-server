import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AugurNotificationsModule } from '@/features/notifications/notifications.module';
import { PatientsModule } from '@/features/patients/patients.module';
import { AppointmentRequestsModule } from './appointment-requests/appointment-requests.module';
import { APPOINTMENT_REMINDER_QUEUE } from './appointments.constants';
import { AppointmentsConsumer } from './appointments.consumer';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentSchema } from './entities/appointment.entity';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ schema: AppointmentSchema, name: Appointment.name },
		]),
		BullModule.registerQueue({ name: APPOINTMENT_REMINDER_QUEUE }),
		AppointmentRequestsModule,
		PatientsModule,
		AugurNotificationsModule,
	],
	controllers: [AppointmentsController],
	providers: [AppointmentsService, AppointmentsConsumer],
	exports: [AppointmentsService, AppointmentRequestsModule],
})
export class AppointmentsModule {}
