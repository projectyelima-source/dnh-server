import { Module } from '@nestjs/common';
import { AdherencesModule } from '../adherences/adherences.module';
import { AppointmentRequestsModule } from '../appointments/appointment-requests/appointment-requests.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ConcernsModule } from '../concerns/concerns.module';
import { MedicationsModule } from '../medications/medications.module';
import { AugurNotificationsModule } from '../notifications/notifications.module';
import { PatientsModule } from '../patients/patients.module';
import { VitalHistoriesModule } from '../vital-histories/vital-histories.module';
import { HcpController } from './hcp.controller';
import { HcpService } from './hcp.service';

@Module({
	imports: [
		PatientsModule,
		MedicationsModule,
		AdherencesModule,
		VitalHistoriesModule,
		AppointmentsModule,
		AppointmentRequestsModule,
		ConcernsModule,
		AugurNotificationsModule,
	],
	controllers: [HcpController],
	providers: [HcpService],
})
export class HcpModule {}
