import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { GetUser } from 'src/shared/infrastructure/decorators/get-user.decorator';
import { Roles } from 'src/shared/infrastructure/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/infrastructure/guards/jwt.guard';
import { RolesGuard } from 'src/shared/infrastructure/guards/roles.guard';
import { TenantFilterGuard } from 'src/shared/infrastructure/guards/tenant-filter.guard';
import type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';
import {
  CreateSubscriptionDto,
  SubscriptionResponseDto,
} from '../../application/dtos';
import { SubscriptionPresenter } from '../mappers/subscription.presenter';
import {
  CancelSubscriptionUseCase,
  FindActiveSubscriptionUseCase,
  FindSubscriptionsByOrganizationUseCase,
  SubscribeToPlanUseCase,
} from '../../application/use-cases';

/**
 * HTTP controller for the Subscriptions module.
 *
 * All endpoints require the `ADMIN` role and are scoped to the requesting
 * user's organisation via `TenantFilterGuard`.
 *
 * Base path: `/organizations/:organizationId/subscriptions`
 */
@ApiTags('subscriptions')
@Controller('organizations/:organizationId/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(
    private readonly subscribeToPlan: SubscribeToPlanUseCase,
    private readonly cancelSubscription: CancelSubscriptionUseCase,
    private readonly findActiveSubscription: FindActiveSubscriptionUseCase,
    private readonly findSubscriptionsByOrganization: FindSubscriptionsByOrganizationUseCase,
  ) {}

  /**
   * Creates a new subscription for the organisation.
   * Only one ACTIVE subscription is allowed per organisation at a time.
   *
   * @param dto - Validated request body containing `planId`
   * @returns The newly created subscription as a {@link SubscriptionResponseDto}
   */
  @Post()
  @UseGuards(TenantFilterGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Subscribe organization to a plan' })
  @ApiParam({ name: 'organizationId' })
  @ApiResponse({ status: 201, type: SubscriptionResponseDto })
  async subscribe(
    @Body() dto: CreateSubscriptionDto,
    @GetUser() ctx: TenantContext,
  ): Promise<SubscriptionResponseDto> {
    return SubscriptionPresenter.toHTTP(
      await this.subscribeToPlan.execute(dto, ctx.organizationId!),
    );
  }

  /**
   * Cancels an existing subscription. Only the owning organisation's admin can cancel.
   *
   * @param id - UUID of the subscription to cancel
   * @returns The cancelled subscription as a {@link SubscriptionResponseDto}
   */
  @Patch(':id/cancel')
  @UseGuards(TenantFilterGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary: '[ADMIN] Cancel a subscription (takes effect at expiresAt)',
  })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async cancel(
    @Param('id') id: string,
    @GetUser() ctx: TenantContext,
  ): Promise<SubscriptionResponseDto> {
    return SubscriptionPresenter.toHTTP(
      await this.cancelSubscription.execute(id, ctx.organizationId!),
    );
  }

  /**
   * Returns the currently active subscription for the organisation, or `null` if none exists.
   *
   * @returns The active {@link SubscriptionResponseDto}, or HTTP `200` with `null` body
   */
  @Get('active')
  @UseGuards(TenantFilterGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Get active subscription for organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async findActive(
    @GetUser() ctx: TenantContext,
  ): Promise<SubscriptionResponseDto | null> {
    const result = await this.findActiveSubscription.execute(
      ctx.organizationId!,
    );
    return result ? SubscriptionPresenter.toHTTP(result) : null;
  }

  @Get()
  @UseGuards(TenantFilterGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: '[ADMIN] List all subscriptions for organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, type: PaginatedDto<SubscriptionResponseDto> })
  async findAll(
    @GetUser() ctx: TenantContext,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<SubscriptionResponseDto>> {
    const result = await this.findSubscriptionsByOrganization.execute(
      ctx.organizationId!,
      { page, limit },
    );
    return {
      ...result,
      data: SubscriptionPresenter.toHTTPList(result.data),
    } as PaginatedDto<SubscriptionResponseDto>;
  }
}
