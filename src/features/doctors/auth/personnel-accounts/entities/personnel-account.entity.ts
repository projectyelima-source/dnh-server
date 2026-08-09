import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { BaseEntity } from '@/common/entities';
import { Personnel } from '@/features/doctors/entities/personnel.entity';

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
export class PersonnelAccount extends BaseEntity {
	@Prop({ description: 'The SSO authentication provider' })
	provider: string;

	@Prop({ description: 'The SSO authentication provider user id' })
	providerUserId: string;

	@Prop({ description: "The user's email address" })
	email: string;

	@Prop({ description: 'The hashed password for authentication' })
	password: string;

	@Prop({
		type: ObjectId,
		ref: 'Personnel',
		description: 'Reference to the personnel this account belongs to',
	})
	personnel: Personnel;
}

export const PersonnelAccountSchema =
	SchemaFactory.createForClass(PersonnelAccount);

PersonnelAccountSchema.pre<PersonnelAccount>('save', async function () {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 10);
	}
});
