import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FindPublicTripInstancesUseCase } from '../../application/use-cases/find-public-trip-instances.use-case';
import { PublicTripInstancePresenter } from '../mappers/public-trip-instance.presenter';
import { PublicTripInstanceResponseDto } from '../../application/dtos/public-trip-instance-response.dto';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';

/**
 * HTTP controller for the public, unauthenticated trip-instance listing.
 *
 * @remarks
 * This controller intentionally carries **no** `@UseGuards()` decorator.
 * All endpoints are accessible without a JWT token and are designed to power
 * the public home page of the platform, where prospective passengers browse
 * available trips before registering.
 *
 * Only `SCHEDULED` and `CONFIRMED` instances belonging to templates marked as
 * `isPublic = true` are returned.
 *
 * Endpoints:
 * - `GET /public/trip-instances` — paginated list of bookable public trips,
 *   optionally scoped to a single organisation via `organizationId`
 *
 * Base path: `/public/trip-instances`
 */
@ApiTags('Public')
@Controller('public/trip-instances')
export class PublicTripInstanceController {
  constructor(
    private readonly findPublicTripInstancesUseCase: FindPublicTripInstancesUseCase,
  ) {}

  /**
   * Lists all bookable public trip instances, ordered by nearest departure first.
   *
   * Optionally scoped to a single organisation by passing its UUID as
   * `organizationId`.  The typical frontend call pattern is:
   * 1. Resolve the organisation from its URL slug via `GET /public/organizations/:slug`
   * 2. Use the returned `id` as `organizationId` in this endpoint.
   */
  @Get()
  @ApiOperation({
    summary: 'List bookable public trip instances (no auth required)',
    description:
      'Returns SCHEDULED and CONFIRMED trip instances whose template is marked as ' +
      '`isPublic = true`, ordered by departure time ascending. ' +
      'Pass `organizationId` to scope results to a single organisation.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: '1-based page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Optional organisation UUID to filter trips from a single org',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of public trip instances.',
    type: PaginatedDto<PublicTripInstanceResponseDto>,
  })
  async findPublic(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('organizationId') organizationId?: string,
  ): Promise<PaginatedDto<PublicTripInstanceResponseDto>> {
    const result = await this.findPublicTripInstancesUseCase.execute(
      { page, limit },
      organizationId,
    );
    return new PaginatedDto(
      PublicTripInstancePresenter.toHTTPList(result.data),
      result.total,
      result.page,
      result.limit,
    );
  }
}
