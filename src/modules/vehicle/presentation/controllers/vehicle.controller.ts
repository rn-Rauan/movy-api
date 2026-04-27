import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
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
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
} from '../../application/dtos';
import {
  CreateVehicleUseCase,
  FindVehicleByIdUseCase,
  FindAllVehiclesByOrganizationUseCase,
  UpdateVehicleUseCase,
  RemoveVehicleUseCase,
} from '../../application/use-cases';
import { VehiclePresenter } from '../mappers/vehicle.presenter';

/**
 * HTTP controller for vehicle management.
 *
 * All endpoints require authentication (`JwtAuthGuard`) and are further
 * restricted to organisation administrators (`RolesGuard` + `TenantFilterGuard`).
 *
 * Endpoints:
 * - `POST /vehicles/organization/:organizationId` — register a new vehicle
 * - `GET /vehicles/organization/:organizationId` — list all vehicles (paginated)
 * - `GET /vehicles/:id` — get by ID
 * - `PUT /vehicles/:id` — partial update
 * - `DELETE /vehicles/:id` — soft-deactivate
 *
 * Base path: `/vehicles`
 */
@ApiTags('vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehicleController {
  constructor(
    private readonly createVehicleUseCase: CreateVehicleUseCase,
    private readonly findVehicleByIdUseCase: FindVehicleByIdUseCase,
    private readonly findAllVehiclesByOrganizationUseCase: FindAllVehiclesByOrganizationUseCase,
    private readonly updateVehicleUseCase: UpdateVehicleUseCase,
    private readonly removeVehicleUseCase: RemoveVehicleUseCase,
  ) {}

  @Post('organization/:organizationId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Register a new vehicle for an organization' })
  @ApiParam({ name: 'organizationId', description: 'UUID of the organization' })
  @ApiResponse({
    status: 201,
    description: 'Vehicle registered successfully.',
    type: VehicleResponseDto,
  })
  async create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.createVehicleUseCase.execute(
      createDto,
      organizationId,
    );
    return VehiclePresenter.toHTTP(vehicle);
  }

  @Get('organization/:organizationId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'List all vehicles in an organization' })
  @ApiParam({ name: 'organizationId', description: 'UUID of the organization' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of vehicles.',
    type: PaginatedDto<VehicleResponseDto>,
  })
  async findByOrganization(
    @Param('organizationId') organizationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<VehicleResponseDto>> {
    const result = await this.findAllVehiclesByOrganizationUseCase.execute(
      organizationId,
      { page, limit },
    );
    return new PaginatedDto(
      VehiclePresenter.toHTTPList(result.data),
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Find a vehicle by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the vehicle' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle found.',
    type: VehicleResponseDto,
  })
  async findById(
    @Param('id') id: string,
    @GetUser() context: TenantContext,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.findVehicleByIdUseCase.execute(
      id,
      context.organizationId!,
    );
    return VehiclePresenter.toHTTP(vehicle);
  }

  @Put(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Update a vehicle' })
  @ApiParam({ name: 'id', description: 'UUID of the vehicle to update' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle updated successfully.',
    type: VehicleResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateVehicleDto,
    @GetUser() context: TenantContext,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.updateVehicleUseCase.execute(
      id,
      updateDto,
      context.organizationId!,
    );
    return VehiclePresenter.toHTTP(vehicle);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Deactivate a vehicle (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID of the vehicle to deactivate' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle deactivated successfully.',
  })
  async remove(
    @Param('id') id: string,
    @GetUser() context: TenantContext,
  ): Promise<boolean> {
    await this.removeVehicleUseCase.execute(id, context.organizationId!);
    return true;
  }
}
