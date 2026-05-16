import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleName } from 'src/shared';
import { Roles } from 'src/shared/infrastructure/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/infrastructure/guards/jwt.guard';
import { RolesGuard } from 'src/shared/infrastructure/guards/roles.guard';
import { TenantFilterGuard } from 'src/shared/infrastructure/guards/tenant-filter.guard';
import {
  FindTripSchedulingConfigUseCase,
  UpdateTripSchedulingConfigUseCase,
} from '../../application/use-cases';
import {
  TripSchedulingConfigResponseDto,
  UpdateTripSchedulingConfigDto,
} from '../../application/dtos';
import { TripSchedulingConfigPresenter } from '../mappers/trip-scheduling-config.presenter';

/**
 * HTTP controller for organisation-level scheduling configuration.
 *
 * - `GET /organizations/:organizationId/scheduling-config` — fetch config
 * - `PATCH /organizations/:organizationId/scheduling-config` — partial update
 *
 * All endpoints require ADMIN role and pass `TenantFilterGuard` (the
 * `:organizationId` route param must match the caller's tenant).
 */
@ApiTags('scheduling')
@Controller('organizations/:organizationId/scheduling-config')
@UseGuards(JwtAuthGuard, TenantFilterGuard, RolesGuard)
@Roles(RoleName.ADMIN)
export class TripSchedulingConfigController {
  constructor(
    private readonly findUseCase: FindTripSchedulingConfigUseCase,
    private readonly updateUseCase: UpdateTripSchedulingConfigUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get scheduling config for an organisation' })
  @ApiParam({ name: 'organizationId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: TripSchedulingConfigResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Config not found for the organisation',
  })
  async find(
    @Param('organizationId') organizationId: string,
  ): Promise<TripSchedulingConfigResponseDto> {
    const config = await this.findUseCase.execute(organizationId);
    return TripSchedulingConfigPresenter.toHTTP(config);
  }

  @Patch()
  @ApiOperation({ summary: 'Update scheduling config (partial)' })
  @ApiParam({ name: 'organizationId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: TripSchedulingConfigResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid daysAhead or cron expression',
  })
  @ApiResponse({
    status: 404,
    description: 'Config not found for the organisation',
  })
  async update(
    @Param('organizationId') organizationId: string,
    @Body() body: UpdateTripSchedulingConfigDto,
  ): Promise<TripSchedulingConfigResponseDto> {
    const config = await this.updateUseCase.execute(organizationId, body);
    return TripSchedulingConfigPresenter.toHTTP(config);
  }
}
