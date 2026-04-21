import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { GetUser } from 'src/shared/infrastructure/decorators/get-user.decorator';
import { Roles } from 'src/shared/infrastructure/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/infrastructure/guards/jwt.guard';
import { RolesGuard } from 'src/shared/infrastructure/guards/roles.guard';
import { TenantFilterGuard } from 'src/shared/infrastructure/guards/tenant-filter.guard';
import type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';
import {
  CreateTripInstanceDto,
  TransitionTripInstanceStatusDto,
  TripInstanceResponseDto,
} from '../../application/dtos';
import {
  AssignDriverToTripInstanceUseCase,
  AssignVehicleToTripInstanceUseCase,
  CreateTripInstanceUseCase,
  FindAllTripInstancesByOrganizationUseCase,
  FindTripInstanceByIdUseCase,
  FindTripInstancesByTemplateUseCase,
  TransitionTripInstanceStatusUseCase,
} from '../../application/use-cases';
import { TripInstancePresenter } from '../mappers/trip-instance.presenter';

@ApiTags('trip-instances')
@Controller('trip-instances')
@UseGuards(JwtAuthGuard)
export class TripInstanceController {
  constructor(
    private readonly createTripInstanceUseCase: CreateTripInstanceUseCase,
    private readonly findTripInstanceByIdUseCase: FindTripInstanceByIdUseCase,
    private readonly findAllTripInstancesByOrganizationUseCase: FindAllTripInstancesByOrganizationUseCase,
    private readonly findTripInstancesByTemplateUseCase: FindTripInstancesByTemplateUseCase,
    private readonly transitionTripInstanceStatusUseCase: TransitionTripInstanceStatusUseCase,
    private readonly assignDriverToTripInstanceUseCase: AssignDriverToTripInstanceUseCase,
    private readonly assignVehicleToTripInstanceUseCase: AssignVehicleToTripInstanceUseCase,
  ) {}

  @Post('organization/:organizationId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Create a new trip instance from a trip template' })
  @ApiParam({ name: 'organizationId', description: 'UUID of the organization' })
  @ApiResponse({
    status: 201,
    description: 'Trip instance created successfully.',
    type: TripInstanceResponseDto,
  })
  async create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateTripInstanceDto,
  ): Promise<TripInstanceResponseDto> {
    const instance = await this.createTripInstanceUseCase.execute(
      createDto,
      organizationId,
    );
    return TripInstancePresenter.toHTTP(instance);
  }

  @Get('organization/:organizationId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'List all trip instances in an organization' })
  @ApiParam({ name: 'organizationId', description: 'UUID of the organization' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of trip instances.',
    type: PaginatedDto<TripInstanceResponseDto>,
  })
  async findByOrganization(
    @Param('organizationId') organizationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<TripInstanceResponseDto>> {
    const result = await this.findAllTripInstancesByOrganizationUseCase.execute(
      organizationId,
      { page, limit },
    );
    return new PaginatedDto(
      TripInstancePresenter.toHTTPList(result.data),
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get('template/:templateId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'List all trip instances for a given template' })
  @ApiParam({
    name: 'templateId',
    description: 'UUID of the trip template',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of trip instances for the template.',
    type: PaginatedDto<TripInstanceResponseDto>,
  })
  async findByTemplate(
    @Param('templateId') templateId: string,
    @GetUser() context: TenantContext,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<TripInstanceResponseDto>> {
    const result = await this.findTripInstancesByTemplateUseCase.execute(
      templateId,
      context.organizationId!,
      { page, limit },
    );
    return new PaginatedDto(
      TripInstancePresenter.toHTTPList(result.data),
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Find a trip instance by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the trip instance' })
  @ApiResponse({
    status: 200,
    description: 'Trip instance found.',
    type: TripInstanceResponseDto,
  })
  async findById(
    @Param('id') id: string,
    @GetUser() context: TenantContext,
  ): Promise<TripInstanceResponseDto> {
    const instance = await this.findTripInstanceByIdUseCase.execute(
      id,
      context.organizationId!,
    );
    return TripInstancePresenter.toHTTP(instance);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Transition trip instance to a new lifecycle status',
  })
  @ApiParam({ name: 'id', description: 'UUID of the trip instance' })
  @ApiResponse({
    status: 200,
    description: 'Trip instance status updated.',
    type: TripInstanceResponseDto,
  })
  async transitionStatus(
    @Param('id') id: string,
    @Body() dto: TransitionTripInstanceStatusDto,
    @GetUser() context: TenantContext,
  ): Promise<TripInstanceResponseDto> {
    const instance = await this.transitionTripInstanceStatusUseCase.execute(
      id,
      dto,
      context.organizationId!,
    );
    return TripInstancePresenter.toHTTP(instance);
  }

  @Put(':id/driver')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Assign or unassign a driver to a trip instance' })
  @ApiParam({ name: 'id', description: 'UUID of the trip instance' })
  @ApiQuery({
    name: 'driverId',
    required: false,
    description: 'UUID of the driver to assign, omit to unassign',
  })
  @ApiResponse({
    status: 200,
    description: 'Driver assignment updated.',
    type: TripInstanceResponseDto,
  })
  async assignDriver(
    @Param('id') id: string,
    @Query('driverId') driverId: string | undefined,
    @GetUser() context: TenantContext,
  ): Promise<TripInstanceResponseDto> {
    const instance = await this.assignDriverToTripInstanceUseCase.execute(
      id,
      driverId ?? null,
      context.organizationId!,
    );
    return TripInstancePresenter.toHTTP(instance);
  }

  @Put(':id/vehicle')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Assign or unassign a vehicle to a trip instance' })
  @ApiParam({ name: 'id', description: 'UUID of the trip instance' })
  @ApiQuery({
    name: 'vehicleId',
    required: false,
    description: 'UUID of the vehicle to assign, omit to unassign',
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicle assignment updated.',
    type: TripInstanceResponseDto,
  })
  async assignVehicle(
    @Param('id') id: string,
    @Query('vehicleId') vehicleId: string | undefined,
    @GetUser() context: TenantContext,
  ): Promise<TripInstanceResponseDto> {
    const instance = await this.assignVehicleToTripInstanceUseCase.execute(
      id,
      vehicleId ?? null,
      context.organizationId!,
    );
    return TripInstancePresenter.toHTTP(instance);
  }
}
