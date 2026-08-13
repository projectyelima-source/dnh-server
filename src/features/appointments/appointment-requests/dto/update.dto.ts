import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { AppointmentRequestStatus } from './appointment-request.dto';
import { CreateAppointmentRequestDto } from './create.dto';

export class UpdateAppointmentRequestDto extends PartialType(
	CreateAppointmentRequestDto,
) {
	@ApiPropertyOptional({
		description: 'Current status of the request',
		enum: AppointmentRequestStatus,
	})
	@IsEnum(AppointmentRequestStatus)
	@IsOptional()
	status?: AppointmentRequestStatus;
}

export class UpdateAppointmentRequestStatusDto {
	@ApiProperty({
		description: 'New status for the appointment request',
		enum: AppointmentRequestStatus,
		example: AppointmentRequestStatus.APPROVED,
	})
	@IsEnum(AppointmentRequestStatus)
	@IsNotEmpty()
	status: AppointmentRequestStatus;
}
