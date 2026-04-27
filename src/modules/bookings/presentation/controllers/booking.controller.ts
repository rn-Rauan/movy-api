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
  BookingAvailabilityResponseDto,
  BookingDetailsResponseDto,
  BookingResponseDto,
  CreateBookingDto,
} from '../../application/dtos';
import {
  CancelBookingUseCase,
  ConfirmPresenceUseCase,
  CreateBookingUseCase,
  FindBookingByIdUseCase,
  FindBookingDetailsUseCase,
  FindBookingsByOrganizationUseCase,
  FindBookingsByTripInstanceUseCase,
  FindBookingsByUserUseCase,
  GetBookingAvailabilityUseCase,
} from '../../application/use-cases';
import { BookingPresenter } from '../mappers/booking.presenter';

/**
 * HTTP controller for the Bookings module.
 *
 * Exposes 9 endpoints spanning booking creation, cancellation, presence confirmation,
 * availability check, and various paginated list queries.
 *
 * Access control varies per endpoint:
 * - `POST /bookings` — any authenticated user (B2C or org member)
 * - `GET /bookings/organization/:organizationId` — org `ADMIN` only, scoped by `TenantFilterGuard`
 * - `GET /bookings/user` — any authenticated user (returns own bookings)
 * - `GET /bookings/trip-instance/:tripInstanceId` — org member of the owning org
 * - `GET /bookings/availability/:tripInstanceId` — any authenticated user
 * - `GET /bookings/:id` — owner or org member
 * - `GET /bookings/:id/details` — owner or org member
 * - `PATCH /bookings/:id/cancel` — owner or org member
 * - `PATCH /bookings/:id/confirm-presence` — org member only
 *
 * Base path: `/bookings`
 */
@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
    private readonly confirmPresenceUseCase: ConfirmPresenceUseCase,
    private readonly findBookingByIdUseCase: FindBookingByIdUseCase,
    private readonly findBookingDetailsUseCase: FindBookingDetailsUseCase,
    private readonly findBookingsByOrganizationUseCase: FindBookingsByOrganizationUseCase,
    private readonly findBookingsByTripInstanceUseCase: FindBookingsByTripInstanceUseCase,
    private readonly findBookingsByUserUseCase: FindBookingsByUserUseCase,
    private readonly getBookingAvailabilityUseCase: GetBookingAvailabilityUseCase,
  ) {}

  // ── Criar inscricao ────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Enroll authenticated user in a trip instance' })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully.',
    type: BookingResponseDto,
  })
  async create(
    @Body() createDto: CreateBookingDto,
    @GetUser() context: TenantContext,
  ): Promise<BookingResponseDto> {
    return BookingPresenter.toHTTP(
      await this.createBookingUseCase.execute(createDto, context.userId),
    );
  }

  // ── Listagens paginadas ────────────────────────────────────────────────────

  @Get('organization/:organizationId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'List all bookings in an organization (paginated)' })
  @ApiParam({ name: 'organizationId', description: 'UUID of the organization' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of bookings.',
    type: PaginatedDto<BookingResponseDto>,
  })
  async findByOrganization(
    @Param('organizationId') organizationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<BookingResponseDto>> {
    const result = await this.findBookingsByOrganizationUseCase.execute(
      organizationId,
      { page, limit },
    );
    return new PaginatedDto(
      BookingPresenter.toHTTPList(result.data),
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get('user')
  @ApiOperation({
    summary: 'List bookings of the authenticated user (paginated)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'INACTIVE'],
    description: 'Filter bookings by status',
  })
  @ApiResponse({
    status: 200,
    description: "Paginated list of authenticated user's bookings.",
    type: PaginatedDto<BookingResponseDto>,
  })
  async findByUser(
    @GetUser() context: TenantContext,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: 'ACTIVE' | 'INACTIVE',
  ): Promise<PaginatedDto<BookingResponseDto>> {
    const result = await this.findBookingsByUserUseCase.execute(
      context.userId,
      { page, limit },
      status,
    );
    return new PaginatedDto(
      BookingPresenter.toHTTPList(result.data),
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get('trip-instance/:tripInstanceId')
  @ApiOperation({
    summary: 'List all bookings for a given trip instance (paginated)',
  })
  @ApiParam({
    name: 'tripInstanceId',
    description: 'UUID of the trip instance',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of bookings for the trip instance.',
    type: PaginatedDto<BookingResponseDto>,
  })
  async findByTripInstance(
    @Param('tripInstanceId') tripInstanceId: string,
    @GetUser() context: TenantContext,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<BookingResponseDto>> {
    const result = await this.findBookingsByTripInstanceUseCase.execute(
      tripInstanceId,
      { page, limit },
      context.organizationId,
    );
    return new PaginatedDto(
      BookingPresenter.toHTTPList(result.data),
      result.total,
      result.page,
      result.limit,
    );
  }

  // ── Disponibilidade de vagas ─────────────────────────────────────────────

  @Get('availability/:tripInstanceId')
  @ApiOperation({
    summary: 'Check available slots for a trip instance before booking',
  })
  @ApiParam({
    name: 'tripInstanceId',
    description: 'UUID of the trip instance',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability data for the trip instance.',
    type: BookingAvailabilityResponseDto,
  })
  async getAvailability(
    @Param('tripInstanceId') tripInstanceId: string,
  ): Promise<BookingAvailabilityResponseDto> {
    return this.getBookingAvailabilityUseCase.execute(tripInstanceId);
  }

  // ── Busca por ID ───────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Find a booking by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the booking' })
  @ApiResponse({
    status: 200,
    description: 'Booking found.',
    type: BookingResponseDto,
  })
  async findById(
    @Param('id') id: string,
    @GetUser() context: TenantContext,
  ): Promise<BookingResponseDto> {
    return BookingPresenter.toHTTP(
      await this.findBookingByIdUseCase.execute(
        id,
        context.userId,
        context.organizationId,
      ),
    );
  }

  @Get(':id/details')
  @ApiOperation({
    summary:
      'Find a booking with enriched trip instance data (departure, status, available slots)',
  })
  @ApiParam({ name: 'id', description: 'UUID of the booking' })
  @ApiResponse({
    status: 200,
    description: 'Booking with trip details.',
    type: BookingDetailsResponseDto,
  })
  async findDetails(
    @Param('id') id: string,
    @GetUser() context: TenantContext,
  ): Promise<BookingDetailsResponseDto> {
    return this.findBookingDetailsUseCase.execute(
      id,
      context.userId,
      context.organizationId,
    );
  }

  // ── Acoes de estado ────────────────────────────────────────────────────────

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking (soft delete — status INACTIVE)' })
  @ApiParam({ name: 'id', description: 'UUID of the booking' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled.',
    type: BookingResponseDto,
  })
  async cancel(
    @Param('id') id: string,
    @GetUser() context: TenantContext,
  ): Promise<BookingResponseDto> {
    return BookingPresenter.toHTTP(
      await this.cancelBookingUseCase.execute(
        id,
        context.userId,
        context.organizationId,
      ),
    );
  }

  @Patch(':id/confirm-presence')
  @ApiOperation({ summary: 'Confirm passenger presence for a booking' })
  @ApiParam({ name: 'id', description: 'UUID of the booking' })
  @ApiResponse({
    status: 200,
    description: 'Presence confirmed.',
    type: BookingResponseDto,
  })
  async confirmPresence(
    @Param('id') id: string,
    @GetUser() context: TenantContext,
  ): Promise<BookingResponseDto> {
    return BookingPresenter.toHTTP(
      await this.confirmPresenceUseCase.execute(
        id,
        context.userId,
        context.organizationId,
      ),
    );
  }
}
