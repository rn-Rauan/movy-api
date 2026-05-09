import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleName } from 'src/shared';
import { GetUser } from 'src/shared/infrastructure/decorators/get-user.decorator';
import { Roles } from 'src/shared/infrastructure/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/infrastructure/guards/jwt.guard';
import { RolesGuard } from 'src/shared/infrastructure/guards/roles.guard';
import { TenantFilterGuard } from 'src/shared/infrastructure/guards/tenant-filter.guard';
import type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';
import { PlanUsageResponseDto } from '../../application/dtos/plan-usage-response.dto';
import { FindPlanUsageUseCase } from '../../application/use-cases';

/**
 * HTTP controller exposing the organisation's current plan usage.
 *
 * Returns the consumed/maximum counts for each metered resource (vehicles,
 * drivers, monthlyTrips) so the frontend can render a single source of truth
 * matching the backend's plan-limit enforcement.
 *
 * Base path: `/organizations/:organizationId/plan-usage`
 */
@ApiTags('plan-usage')
@Controller('organizations/:organizationId/plan-usage')
@UseGuards(JwtAuthGuard)
export class PlanUsageController {
  constructor(private readonly findPlanUsage: FindPlanUsageUseCase) {}

  @Get()
  @UseGuards(TenantFilterGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Get plan usage for organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiResponse({ status: 200, type: PlanUsageResponseDto })
  async get(@GetUser() ctx: TenantContext): Promise<PlanUsageResponseDto> {
    return this.findPlanUsage.execute(ctx.organizationId!);
  }
}
