import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { TripStatus } from '../../domain/interfaces';

/**
 * Query parameters for `GET /trip-instances/driver/me`.
 *
 * All fields are optional. `page` and `limit` follow the standard pagination
 * contract; `status` filters instances by their current lifecycle state.
 */
export class FindTripInstancesByDriverQueryDto {
  @ApiPropertyOptional({
    enum: TripStatus,
    description: 'Filter by trip instance lifecycle status',
  })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
