import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/infrastructure/guards/jwt.guard';
import { RolesGuard } from 'src/shared/infrastructure/guards/roles.guard';
import { TenantFilterGuard } from 'src/shared/infrastructure/guards/tenant-filter.guard';
import { Roles } from 'src/shared/infrastructure/decorators/roles.decorator';
import { GetUser } from 'src/shared/infrastructure/decorators/get-user.decorator';
import { RoleName } from 'src/shared';
import type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateDriverDto,
  UpdateDriverDto,
  DriverResponseDto,
  DriverLookupResponseDto,
} from '../../application/dtos';
import { DriverPresenter } from '../mappers/driver.presenter';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';
import {
  CreateDriverUseCase,
  FindDriverByIdUseCase,
  FindDriverByUserIdUseCase,
  UpdateDriverUseCase,
  RemoveDriverUseCase,
  FindAllDriversByOrganizationUseCase,
  LookupDriverUseCase,
} from '../../application/use-cases';

/**
 * HTTP controller for driver profile management.
 *
 * @remarks
 * Self-service endpoints (authenticated user, any role):
 * - `POST /drivers` — create own driver profile
 * - `GET /drivers/me` — get own driver profile
 *
 * Admin-only endpoints (`RolesGuard` + `ADMIN` role):
 * - `GET /drivers/lookup` — look up a driver by email + CNH (enrollment)
 * - `GET /drivers` — list all org drivers (paginated)
 * - `GET /drivers/:id` — find by ID (org-scoped)
 * - `PUT /drivers/:id` — partial update (org-scoped)
 * - `DELETE /drivers/:id` — soft-delete — sets status to `INACTIVE` (org-scoped)
 *
 * Base path: `/drivers`
 */
@ApiTags('drivers')
@Controller('drivers')
@UseGuards(JwtAuthGuard)
export class DriverController {
  constructor(
    private readonly createDriverUseCase: CreateDriverUseCase,
    private readonly findDriverByIdUseCase: FindDriverByIdUseCase,
    private readonly findDriverByUserIdUseCase: FindDriverByUserIdUseCase,
    private readonly updateDriverUseCase: UpdateDriverUseCase,
    private readonly removeDriverUseCase: RemoveDriverUseCase,
    private readonly findAllDriversByOrganizationUseCase: FindAllDriversByOrganizationUseCase,
    private readonly lookupDriverUseCase: LookupDriverUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new driver profile',
  })
  @ApiResponse({
    status: 201,
    description: 'Driver profile created successfully.',
    type: DriverResponseDto,
  })
  async create(
    @Body() createDto: CreateDriverDto,
    @GetUser() context: TenantContext,
  ): Promise<DriverResponseDto> {
    const driver = await this.createDriverUseCase.execute(
      context.userId,
      createDto,
    );
    return DriverPresenter.toHTTP(driver);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current driver profile' })
  @ApiResponse({
    status: 200,
    description: 'Return current driver profile.',
    type: DriverResponseDto,
  })
  async getMe(@GetUser() context: TenantContext): Promise<DriverResponseDto> {
    const driver = await this.findDriverByUserIdUseCase.execute(context.userId);
    return DriverPresenter.toHTTP(driver);
  }

  @Get('lookup')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Lookup driver profile by email and CNH (Admin only)',
  })
  @ApiQuery({ name: 'email', required: true, example: 'joao@email.com' })
  @ApiQuery({ name: 'cnh', required: true, example: '123456789' })
  @ApiResponse({
    status: 200,
    description: 'Driver profile found.',
    type: DriverLookupResponseDto,
  })
  async lookup(
    @Query('email') email: string,
    @Query('cnh') cnh: string,
  ): Promise<DriverLookupResponseDto> {
    if (!email?.trim()) {
      throw new BadRequestException(
        'Query parameter "email" is required and cannot be empty',
      );
    }
    if (!cnh?.trim()) {
      throw new BadRequestException(
        'Query parameter "cnh" is required and cannot be empty',
      );
    }
    return this.lookupDriverUseCase.execute(email, cnh);
  }

  @Get('organization/:organizationId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Find all drivers in an organization (for ADMIN)' })
  @ApiParam({
    name: 'organizationId',
    description: 'The ID of the organization',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Return all drivers in organization.',
    type: PaginatedDto<DriverResponseDto>,
  })
  async findByOrganization(
    @Param('organizationId') organizationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<DriverResponseDto>> {
    const result = await this.findAllDriversByOrganizationUseCase.execute(
      organizationId,
      { page, limit },
    );
    return new PaginatedDto(
      DriverPresenter.toHTTPList(result.data),
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Find a driver by ID (for ADMIN)' })
  @ApiParam({ name: 'id', description: 'The ID of the driver to find' })
  @ApiResponse({
    status: 200,
    description: 'Return the driver.',
    type: DriverResponseDto,
  })
  async findById(
    @Param('id') id: string,
    @GetUser() context: TenantContext,
  ): Promise<DriverResponseDto> {
    const driver = await this.findDriverByIdUseCase.execute(
      id,
      context.organizationId!,
    );
    return DriverPresenter.toHTTP(driver);
  }

  @Put(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Update a driver' })
  @ApiParam({ name: 'id', description: 'The ID of the driver to update' })
  @ApiResponse({
    status: 200,
    description: 'The driver has been successfully updated.',
    type: DriverResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDriverDto,
    @GetUser() context: TenantContext,
  ): Promise<DriverResponseDto> {
    const driver = await this.updateDriverUseCase.execute(
      id,
      updateDto,
      context.organizationId!,
    );
    return DriverPresenter.toHTTP(driver);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Delete a driver (for ADMIN)' })
  @ApiParam({ name: 'id', description: 'The ID of the driver to delete' })
  @ApiResponse({
    status: 200,
    description: 'The driver has been successfully deleted.',
  })
  async remove(
    @Param('id') id: string,
    @GetUser() context: TenantContext,
  ): Promise<boolean> {
    await this.removeDriverUseCase.execute(id, context.organizationId!);
    return true;
  }
}
