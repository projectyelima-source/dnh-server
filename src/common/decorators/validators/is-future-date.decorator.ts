import {
	registerDecorator,
	ValidationArguments,
	ValidationOptions,
} from 'class-validator';

export function IsFutureDate(options?: ValidationOptions) {
	return (object: any, propertyName: string) => {
		registerDecorator({
			name: 'isFutureDate',
			target: object.constructor,
			propertyName,
			options,
			validator: {
				validate(value: any) {
					if (!value) return true;
					return new Date(value) >= new Date();
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} must not be a date in the past`;
				},
			},
		});
	};
}
