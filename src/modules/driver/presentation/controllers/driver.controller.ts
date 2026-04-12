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
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/infrastructure/guards/jwt.guard';
import { RolesGuard } from 'src/shared/infrastructure/guards/roles.guard';
import { TenantFilterGuard } from 'src/shared/infrastructure/guards/tenant-filter.guard';
import { Roles } from 'src/shared/infrastructure/decorators/roles.decorator';
import { GetTenantContext } from 'src/shared/infrastructure/decorators/get-tenant-context.decorator';
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
} from '../../application/use-cases';

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
  ) {}

  @Post()
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Create a new driver' })
  @ApiResponse({
    status: 201,
    description: 'The driver has been successfully created.',
    type: DriverResponseDto,
  })
  async create(@Body() createDto: CreateDriverDto): Promise<DriverResponseDto> {
    const driver = await this.createDriverUseCase.execute(createDto);
    return DriverPresenter.toHTTP(driver);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current driver profile' })
  @ApiResponse({
    status: 200,
    description: 'Return current driver profile.',
    type: DriverResponseDto,
  })
  async getMe(
    @GetTenantContext() context: TenantContext,
  ): Promise<DriverResponseDto> {
    const driver = await this.findDriverByUserIdUseCase.execute(context.userId);
    return DriverPresenter.toHTTP(driver);
  }

  @Get('organization/:organizationId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Find all drivers in an organization' })
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

    const data = DriverPresenter.toHTTPList(result.data);

    return new PaginatedDto(data, result.total, result.page, result.limit);
  }

  @Get(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Find a driver by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the driver to find' })
  @ApiResponse({
    status: 200,
    description: 'Return the driver.',
    type: DriverResponseDto,
  })
  async findById(@Param('id') id: string): Promise<DriverResponseDto> {
    const driver = await this.findDriverByIdUseCase.execute(id);
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
  ): Promise<DriverResponseDto> {
    const driver = await this.updateDriverUseCase.execute(id, updateDto);
    return DriverPresenter.toHTTP(driver);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Delete a driver' })
  @ApiParam({ name: 'id', description: 'The ID of the driver to delete' })
  @ApiResponse({
    status: 200,
    description: 'The driver has been successfully deleted.',
  })
  async remove(@Param('id') id: string): Promise<boolean> {
    await this.removeDriverUseCase.execute(id);
    return true;
  }
}
