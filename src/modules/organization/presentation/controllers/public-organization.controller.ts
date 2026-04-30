import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FindOrganizationBySlugUseCase } from '../../application/use-cases/find-organization-by-slug.use-case';
import { OrganizationPresenter } from '../mappers/organization.mapper';
import { OrganizationResponseDto } from '../../application/dtos';

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
 * - `GET /public/organizations/:slug` — resolve an active organisation by slug
 *
 * Base path: `/public/organizations`
 */
@ApiTags('Public')
@Controller('public/organizations')
export class PublicOrganizationController {
  constructor(
    private readonly findOrganizationBySlugUseCase: FindOrganizationBySlugUseCase,
    private readonly organizationPresenter: OrganizationPresenter,
  ) {}

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
