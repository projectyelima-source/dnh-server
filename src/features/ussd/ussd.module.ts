import { Module } from '@nestjs/common';
import { PatientsModule } from '@/features/patients/patients.module';
import { VitalHistoriesModule } from '@/features/vital-histories/vital-histories.module';
import { UssdController } from './ussd.controller';
import { UssdService } from './ussd.service';

@Module({
	imports: [PatientsModule, VitalHistoriesModule],
	controllers: [UssdController],
	providers: [UssdService],
})
export class UssdModule {}
