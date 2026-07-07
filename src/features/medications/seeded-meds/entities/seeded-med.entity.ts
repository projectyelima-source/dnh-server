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
export class SeededMed extends BaseEntity {
	@Prop({ required: true, unique: true })
	name: string;

	@Prop({ type: [String], default: [] })
	possibleDosages: string[];
}

export const SeededMedSchema = SchemaFactory.createForClass(SeededMed);
