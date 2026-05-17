import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleName } from 'src/shared';
import { Roles } from 'src/shared/infrastructure/decorators/roles.decorator';
import { GetUser } from 'src/shared/infrastructure/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/shared/infrastructure/guards/jwt.guard';
import { RolesGuard } from 'src/shared/infrastructure/guards/roles.guard';
import { TenantFilterGuard } from 'src/shared/infrastructure/guards/tenant-filter.guard';
import type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';
import {
  CreateTripTemplateDto,
  GenerateTripInstancesDto,
  GenerateTripInstancesResponseDto,
  UpdateTripTemplateDto,
  TripTemplateResponseDto,
} from '../../application/dtos';
import {
  CreateTripTemplateUseCase,
  FindTripTemplateByIdUseCase,
  FindAllTripTemplatesByOrganizationUseCase,
  GenerateTripInstancesForTemplateUseCase,
  UpdateTripTemplateUseCase,
  DeactivateTripTemplateUseCase,
} from '../../application/use-cases';
import { TripTemplatePresenter } from '../mappers/trip-template.presenter';

/**
 * HTTP controller for the Trip Templates sub-resource.
 *
 * All endpoints require authentication (`JwtAuthGuard`) and are further
 * restricted to organisation administrators (`RolesGuard` + `TenantFilterGuard`).
 *
 * Endpoints:
 * - `POST /trip-templates/organization/:organizationId` — create template
 * - `GET /trip-templates/organization/:organizationId` — list all templates (paginated)
 * - `GET /trip-templates/:id` — get by ID
 * - `PUT /trip-templates/:id` — partial update
 * - `DELETE /trip-templates/:id` — soft-deactivate
 *
 * Base path: `/trip-templates`
 */
/**
 * HTTP controller for the Trip Templates sub-resource.
 *
 * All endpoints require authentication (`JwtAuthGuard`) and are further
 * restricted to organisation administrators (`RolesGuard` + `TenantFilterGuard`).
 *
 * Endpoints:
 * - `POST /trip-templates/organization/:organizationId` — create template
 * - `GET /trip-templates/organization/:organizationId` — list all templates (paginated)
 * - `GET /trip-templates/:id` — get by ID
 * - `PUT /trip-templates/:id` — partial update
 * - `DELETE /trip-templates/:id` — soft-deactivate
 *
 * Base path: `/trip-templates`
 */
@ApiTags('trip-templates')
@Controller('trip-templates')
@UseGuards(JwtAuthGuard)
export class TripTemplateController {
  constructor(
    private readonly createTripTemplateUseCase: CreateTripTemplateUseCase,
    private readonly findTripTemplateByIdUseCase: FindTripTemplateByIdUseCase,
    private readonly findAllTripTemplatesByOrganizationUseCase: FindAllTripTemplatesByOrganizationUseCase,
    private readonly updateTripTemplateUseCase: UpdateTripTemplateUseCase,
    private readonly deactivateTripTemplateUseCase: DeactivateTripTemplateUseCase,
    private readonly generateTripInstancesForTemplateUseCase: GenerateTripInstancesForTemplateUseCase,
  ) {}

  @Post('organization/:organizationId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary: '[ADMIN] Create a new trip template for an organization',
  })
  @ApiParam({ name: 'organizationId', description: 'UUID of the organization' })
  @ApiResponse({
    status: 201,
    description: 'Trip template created successfully.',
    type: TripTemplateResponseDto,
  })
  async create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateTripTemplateDto,
  ): Promise<TripTemplateResponseDto> {
    const tripTemplate = await this.createTripTemplateUseCase.execute(
      createDto,
      organizationId,
    );
    return TripTemplatePresenter.toHTTP(tripTemplate);
  }

  @Get('organization/:organizationId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary: '[ADMIN] List all trip templates in an organization',
  })
  @ApiParam({ name: 'organizationId', description: 'UUID of the organization' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of trip templates.',
    type: PaginatedDto<TripTemplateResponseDto>,
  })
  async findByOrganization(
    @Param('organizationId') organizationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<TripTemplateResponseDto>> {
    const result = await this.findAllTripTemplatesByOrganizationUseCase.execute(
      organizationId,
      { page, limit },
    );
    return new PaginatedDto(
      TripTemplatePresenter.toHTTPList(result.data),
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Find a trip template by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the trip template' })
  @ApiResponse({
    status: 200,
    description: 'Trip template found.',
    type: TripTemplateResponseDto,
  })
  async findById(
    @Param('id') id: string,
    @GetUser() context: TenantContext,
  ): Promise<TripTemplateResponseDto> {
    const tripTemplate = await this.findTripTemplateByIdUseCase.execute(
      id,
      context.organizationId!,
    );
    return TripTemplatePresenter.toHTTP(tripTemplate);
  }

  @Put(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Update a trip template' })
  @ApiParam({ name: 'id', description: 'UUID of the trip template to update' })
  @ApiResponse({
    status: 200,
    description: 'Trip template updated successfully.',
    type: TripTemplateResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTripTemplateDto,
    @GetUser() context: TenantContext,
  ): Promise<TripTemplateResponseDto> {
    const tripTemplate = await this.updateTripTemplateUseCase.execute(
      id,
      updateDto,
      context.organizationId!,
    );
    return TripTemplatePresenter.toHTTP(tripTemplate);
  }

  @Post(':id/generate-instances')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary:
      '[ADMIN] Manually generate the rolling-window of TripInstances for a recurring template',
    description:
      'Mirrors the daily cron at `0 2 * * *` UTC but scoped to a single template. ' +
      'Useful right after creating a new recurring template (skip waiting for the next tick) ' +
      'or to backfill after cron downtime. Same idempotency, plan-limit and unique-race ' +
      'protections as the cron sweep.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the trip template' })
  @ApiResponse({
    status: 201,
    description: 'Generation result counters.',
    type: GenerateTripInstancesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Template is not recurring, inactive, or missing schedule/capacity.',
  })
  @ApiResponse({
    status: 403,
    description: 'Template belongs to a different organisation.',
  })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  async generateInstances(
    @Param('id') id: string,
    @Body() dto: GenerateTripInstancesDto,
    @GetUser() context: TenantContext,
  ): Promise<GenerateTripInstancesResponseDto> {
    const result = await this.generateTripInstancesForTemplateUseCase.execute(
      id,
      context.organizationId!,
      dto.daysAhead,
    );
    return new GenerateTripInstancesResponseDto(result);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Deactivate a trip template (soft delete)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the trip template to deactivate',
  })
  @ApiResponse({
    status: 200,
    description: 'Trip template deactivated successfully.',
  })
  async deactivate(
    @Param('id') id: string,
    @GetUser() context: TenantContext,
  ): Promise<boolean> {
    await this.deactivateTripTemplateUseCase.execute(
      id,
      context.organizationId!,
    );
    return true;
  }
}
