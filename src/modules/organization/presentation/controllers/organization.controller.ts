import {
  Body,
  Controller,
  Post,
  Get,
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
import { Dev, DevGuard, RoleName } from 'src/shared';
import { GetUser } from 'src/shared/infrastructure/decorators/get-user.decorator';
import type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateOrganizationDto,
  OrganizationResponseDto,
  UpdateOrganizationDto,
} from '../../application/dtos';
import { OrganizationPresenter } from '../mappers/organization.mapper';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';
import {
  CreateOrganizationUseCase,
  FindOrganizationByIdUseCase,
  FindAllOrganizationsUseCase,
  FindAllActiveOrganizationsUseCase,
  FindOrganizationByUserUseCase,
  UpdateOrganizationUseCase,
  DisableOrganizationUseCase,
} from '../../application/use-cases';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly findOrganizationByIdUseCase: FindOrganizationByIdUseCase,
    private readonly findAllOrganizationsUseCase: FindAllOrganizationsUseCase,
    private readonly findAllActiveOrganizationsUseCase: FindAllActiveOrganizationsUseCase,
    private readonly findOrganizationByUserUseCase: FindOrganizationByUserUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly deleteOrganizationUseCase: DisableOrganizationUseCase,
    private readonly organizationPresenter: OrganizationPresenter,
  ) {}

  @Post()
  @UseGuards(DevGuard)
  @Dev()
  @ApiOperation({ summary: 'Create a new organization (dev only)' })
  @ApiResponse({
    status: 201,
    description: 'The organization has been successfully created.',
    type: OrganizationResponseDto,
  })
  async create(
    @Body() createDto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization =
      await this.createOrganizationUseCase.execute(createDto);
    return this.organizationPresenter.toHTTP(organization);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.DRIVER)
  @ApiOperation({ summary: 'Find all organizations the authenticated user belongs to' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Return all organizations associated with the current user.',
    type: PaginatedDto<OrganizationResponseDto>,
  })
  async findByUser(
    @GetUser() user: TenantContext,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<OrganizationResponseDto>> {
    const paginatedResult = await this.findOrganizationByUserUseCase.execute(
      user.userId,
      { page, limit },
    );

    const data = paginatedResult.data.map((org) =>
      this.organizationPresenter.toHTTP(org),
    );

    return new PaginatedDto(
      data,
      paginatedResult.total,
      paginatedResult.page,
      paginatedResult.limit,
    );
  }

  @Get('active')
  @ApiOperation({ summary: 'Find all active organizations' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Return all active organizations.',
    type: PaginatedDto<OrganizationResponseDto>,
  })
  async findAllActive(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<OrganizationResponseDto>> {
    const paginatedResult =
      await this.findAllActiveOrganizationsUseCase.execute({
        page,
        limit,
      });

    const data = paginatedResult.data.map((org) =>
      this.organizationPresenter.toHTTP(org),
    );

    return new PaginatedDto(
      data,
      paginatedResult.total,
      paginatedResult.page,
      paginatedResult.limit,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Find an organization by ID (for ADMIN)' })
  @ApiParam({ name: 'id', description: 'The ID of the organization to find' })
  @ApiResponse({
    status: 200,
    description: 'Return the organization.',
    type: OrganizationResponseDto,
  })
  async findById(
    @Param('id') id: string,
    @GetUser() user: TenantContext,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.findOrganizationByIdUseCase.execute(id, {
      tenantOrganizationId: user.organizationId,
      isDev: user.isDev,
    });
    return this.organizationPresenter.toHTTP(organization);
  }

  @Put(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Update an existing organization (for ADMIN)' })
  @ApiParam({ name: 'id', description: 'The ID of the organization to update' })
  @ApiResponse({
    status: 200,
    description: 'The organization has been successfully updated.',
    type: OrganizationResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationDto,
    @GetUser() user: TenantContext,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.updateOrganizationUseCase.execute(
      id,
      updateDto,
      {
        tenantOrganizationId: user.organizationId,
        isDev: user.isDev,
      },
    );
    return this.organizationPresenter.toHTTP(organization);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Disable an organization (for ADMIN)' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the organization to disable',
  })
  @ApiResponse({
    status: 200,
    description: 'The organization has been successfully disabled.',
    type: Boolean,
  })
  async delete(
    @Param('id') id: string,
    @GetUser() user: TenantContext,
  ): Promise<boolean> {
    await this.deleteOrganizationUseCase.execute(id, {
      tenantOrganizationId: user.organizationId,
      isDev: user.isDev,
    });
    return true;
  }

  @Get()
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Find all organizations of a tenant (for ADMIN)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Return all organizations.',
    type: PaginatedDto<OrganizationResponseDto>,
  })
  async findAll(
    @GetUser() user: TenantContext,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<OrganizationResponseDto>> {
    const paginatedResult = await this.findAllOrganizationsUseCase.execute({
      page,
      limit,
    });

    const data = paginatedResult.data.map((org) =>
      this.organizationPresenter.toHTTP(org),
    );

    return new PaginatedDto(
      data,
      paginatedResult.total,
      paginatedResult.page,
      paginatedResult.limit,
    );
  }
}
