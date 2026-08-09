import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
	PersonnelAccount,
	PersonnelAccountSchema,
} from './entities/personnel-account.entity';
import { PersonnelAccountsController } from './personnel-accounts.controller';
import { PersonnelAccountsService } from './personnel-accounts.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: PersonnelAccount.name, schema: PersonnelAccountSchema },
		]),
	],
	controllers: [PersonnelAccountsController],
	providers: [PersonnelAccountsService],
	exports: [PersonnelAccountsService],
})
export class PersonnelAccountsModule {}
