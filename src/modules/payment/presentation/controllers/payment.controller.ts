import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
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
import { PaymentResponseDto } from '../../application/dtos';
import { PaymentPresenter } from '../mappers/payment.presenter';
import {
  FindPaymentByIdUseCase,
  FindPaymentsByOrganizationUseCase,
} from '../../application/use-cases';

/**
 * HTTP controller for the Payments module.
 *
 * All endpoints require the `ADMIN` role and are scoped to the requesting
 * user's organisation via `TenantFilterGuard`.
 *
 * Base path: `/organizations/:organizationId/payments`
 *
 * @remarks
 * Payments are created implicitly by {@link CreateBookingUseCase} in the Bookings module.
 * This controller exposes read-only operations only.
 */
@ApiTags('payments')
@Controller('organizations/:organizationId/payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(
    private readonly findPaymentById: FindPaymentByIdUseCase,
    private readonly findPaymentsByOrganization: FindPaymentsByOrganizationUseCase,
  ) {}

  /**
   * Retrieves a single payment by its UUID. Requires `ADMIN` role within the organisation.
   *
   * @param id - UUID of the payment to retrieve
   * @returns The payment as a {@link PaymentResponseDto}
   */
  @Get(':id')
  @UseGuards(TenantFilterGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Get payment by id' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async findOne(@Param('id') id: string): Promise<PaymentResponseDto> {
    return PaymentPresenter.toHTTP(await this.findPaymentById.execute(id));
  }

  /**
   * Returns a paginated list of the organisation's payments, ordered by creation date descending.
   *
   * @param page - Page number (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @returns A {@link PaginatedDto} containing {@link PaymentResponseDto} items
   */
  @Get()
  @UseGuards(TenantFilterGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'List payments for organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, type: PaginatedDto<PaymentResponseDto> })
  async findAll(
    @GetUser() ctx: TenantContext,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<PaymentResponseDto>> {
    const result = await this.findPaymentsByOrganization.execute(
      ctx.organizationId!,
      { page, limit },
    );
    return {
      ...result,
      data: PaymentPresenter.toHTTPList(result.data),
    } as PaginatedDto<PaymentResponseDto>;
  }
}
