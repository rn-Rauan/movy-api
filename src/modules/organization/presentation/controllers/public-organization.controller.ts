import {
  Controller,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { FindOrganizationBySlugUseCase } from '../../application/use-cases/find-organization-by-slug.use-case';
import { FindAllActiveOrganizationsUseCase } from '../../application/use-cases';
import { OrganizationPresenter } from '../mappers/organization.mapper';
import { OrganizationResponseDto } from '../../application/dtos';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';

/**
 * HTTP controller for public, unauthenticated organisation lookups.
 *
 * @remarks
 * This controller intentionally carries **no** `@UseGuards()` decorator.
 * All endpoints are accessible without a JWT token and are designed to power
 * public-facing pages of the platform (e.g. an organisation's landing page).
 *
 * Only `ACTIVE` organisations are returned.  Requests for `INACTIVE` slugs
 * produce a `404 Not Found` response without leaking whether the record ever
 * existed.
 *
 * Endpoints:
 * - `GET /public/organizations` — paginated list of active organisations
 * - `GET /public/organizations/:slug` — resolve an active organisation by slug
 *
 * Base path: `/public/organizations`
 */
@ApiTags('Public')
@Controller('public/organizations')
export class PublicOrganizationController {
  constructor(
    private readonly findOrganizationBySlugUseCase: FindOrganizationBySlugUseCase,
    private readonly findAllActiveOrganizationsUseCase: FindAllActiveOrganizationsUseCase,
    private readonly organizationPresenter: OrganizationPresenter,
  ) {}

  /**
   * Returns a paginated list of active organisations.
   *
   * @remarks
   * Public mirror of `GET /organizations/active` (which requires a JWT because
   * its controller is guarded at the class level). No authentication required.
   */
  @Get()
  @ApiOperation({
    summary: 'List active organisations (no auth required)',
    description:
      'Public, paginated list of ACTIVE organisations. Mirrors ' +
      'GET /organizations/active but without authentication.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of active organisations.',
    type: PaginatedDto<OrganizationResponseDto>,
  })
  async findAllActive(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<OrganizationResponseDto>> {
    const result = await this.findAllActiveOrganizationsUseCase.execute({
      page,
      limit,
    });

    const data = result.data.map((org) =>
      this.organizationPresenter.toHTTP(org),
    );

    return new PaginatedDto(data, result.total, result.page, result.limit);
  }

  /**
   * Resolves an active organisation by its URL slug.
   *
   * Typical frontend call sequence:
   * 1. User navigates to `/transport-xpto`
   * 2. Frontend calls `GET /public/organizations/transport-xpto` to obtain the org `id`
   * 3. Frontend calls `GET /public/trip-instances?organizationId=<id>` for the trip list
   */
  @Get(':slug')
  @ApiOperation({
    summary: 'Find active organisation by URL slug (no auth required)',
    description:
      'Resolves an organisation from its human-readable slug. ' +
      'Returns 404 for unknown slugs and for soft-deleted (`INACTIVE`) organisations.',
  })
  @ApiParam({
    name: 'slug',
    example: 'transport-xpto',
    description:
      'URL-friendly identifier generated when the organisation was created',
  })
  @ApiResponse({
    status: 200,
    description: 'The active organisation matching the given slug.',
    type: OrganizationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No active organisation found for the provided slug.',
  })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<OrganizationResponseDto> {
    const org = await this.findOrganizationBySlugUseCase.execute(slug);
    return this.organizationPresenter.toHTTP(org);
  }
}
