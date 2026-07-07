import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeededMed, SeededMedSchema } from './entities/seeded-med.entity';
import { SeededMedsController } from './seeded-meds.controller';
import { SeededMedsService } from './seeded-meds.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: SeededMed.name, schema: SeededMedSchema },
		]),
	],
	controllers: [SeededMedsController],
	providers: [SeededMedsService],
	exports: [SeededMedsService],
})
export class SeededMedsModule {}
