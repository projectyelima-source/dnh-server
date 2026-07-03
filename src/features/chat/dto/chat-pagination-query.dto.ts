import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationRequestDto } from '@/common/dto';

export class ChatPaginationQueryDto extends PickType(PaginationRequestDto, [
	'page',
]) {
	@ApiPropertyOptional({ default: 10, name: 'limit' })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Expose({ name: 'limit' })
	pageSize: number = 10;
}
