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
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { FindPublicTripInstancesUseCase } from '../../application/use-cases/find-public-trip-instances.use-case';
import { FindPublicTripInstancesByOrgSlugUseCase } from '../../application/use-cases/find-public-trip-instances-by-org-slug.use-case';
import { FindPublicTripInstanceByIdUseCase } from '../../application/use-cases/find-public-trip-instance-by-id.use-case';
import { PublicTripInstancePresenter } from '../mappers/public-trip-instance.presenter';
import { PublicTripInstanceResponseDto } from '../../application/dtos/public-trip-instance-response.dto';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';

@ApiTags('Public')
@Controller('public/trip-instances')
export class PublicTripInstanceController {
  constructor(
    private readonly findPublicTripInstancesUseCase: FindPublicTripInstancesUseCase,
    private readonly findPublicTripInstancesByOrgSlugUseCase: FindPublicTripInstancesByOrgSlugUseCase,
    private readonly findPublicTripInstanceByIdUseCase: FindPublicTripInstanceByIdUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List public trips (home page)',
    description:
      'Returns SCHEDULED and CONFIRMED instances from isPublic=true templates, ' +
      'ordered by departure time. Optionally filter by organizationId.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Optional org UUID to scope to a single organisation',
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

  @Get(':id')
  @ApiOperation({
    summary: 'Get public trip instance by ID',
    description:
      'Returns a single SCHEDULED or CONFIRMED trip instance without authentication. ' +
      'Returns 404 if the instance does not exist or is not in a bookable status.',
  })
  @ApiParam({
    name: 'id',
    description: 'Trip instance UUID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Trip instance details.',
    type: PublicTripInstanceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Trip instance not found or not bookable.',
  })
  async findById(
    @Param('id') id: string,
  ): Promise<PublicTripInstanceResponseDto> {
    const data = await this.findPublicTripInstanceByIdUseCase.execute(id);
    return PublicTripInstancePresenter.toHTTP(data);
  }

  @Get('/org/:slug')
  @ApiOperation({
    summary: 'List org trips by slug (org-specific page)',
    description:
      'Returns all SCHEDULED and CONFIRMED instances for the organisation identified by ' +
      ':slug, regardless of isPublic. Used for org-specific trip listing pages ' +
      'shared via a link (e.g. /trips/org-x).',
  })
  @ApiParam({
    name: 'slug',
    description: 'Organisation slug',
    example: 'org-x',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of trip instances for the organisation.',
    type: PaginatedDto<PublicTripInstanceResponseDto>,
  })
  async findByOrgSlug(
    @Param('slug') slug: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<PublicTripInstanceResponseDto>> {
    const result = await this.findPublicTripInstancesByOrgSlugUseCase.execute(
      { page, limit },
      slug,
    );
    return new PaginatedDto(
      PublicTripInstancePresenter.toHTTPList(result.data),
      result.total,
      result.page,
      result.limit,
    );
  }
}
