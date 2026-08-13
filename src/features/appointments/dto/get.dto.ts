import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { IsFutureDate } from '@/common/decorators/validators';
import { PaginationRequestDto } from '@/common/dto';
import { AppointmentDto, AppointmentStatus } from './appointment.dto';

export enum AppointmentFilter {
	UPCOMING = 'upcoming',
	PAST = 'past',
}

export class GetAppointmentDto extends PickType(AppointmentDto, [
	'id',
	'title',
	'appointmentDate',
	'status',
	'hostPersonnel',
]) {}

export class GetAppointmentsQueryDto extends PickType(PaginationRequestDto, [
	'page',
	'pageSize',
]) {
	@ApiPropertyOptional({
		description: 'Filter appointments by time relative to now',
		enum: AppointmentFilter,
		example: AppointmentFilter.UPCOMING,
	})
	@IsOptional()
	@IsEnum(AppointmentFilter)
	filter?: AppointmentFilter;

	@ApiPropertyOptional({
		description: 'Filter by appointment status',
		enum: AppointmentStatus,
		example: AppointmentStatus.SCHEDULED,
	})
	@IsOptional()
	@IsEnum(AppointmentStatus)
	status?: AppointmentStatus;
}

export class CancelAppointmentDto {
	@ApiProperty({ example: 'Patient requested cancellation' })
	@IsString()
	reason: string;
}

export class RescheduleAppointmentDto {
	@ApiProperty({ example: 'Patient requested a later time' })
	@IsString()
	reason: string;

	@ApiProperty({
		description: 'New date and time for the appointment',
		example: '2026-07-01T10:00:00.000Z',
	})
	@IsDateString()
	@IsFutureDate()
	appointmentDate: string;
}
