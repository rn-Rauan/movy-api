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
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';
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
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly deleteOrganizationUseCase: DisableOrganizationUseCase,
    private readonly organizationPresenter: OrganizationPresenter,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
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
  @ApiOperation({ summary: 'Find an organization by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the organization to find' })
  @ApiResponse({
    status: 200,
    description: 'Return the organization.',
    type: OrganizationResponseDto,
  })
  async findById(@Param('id') id: string): Promise<OrganizationResponseDto> {
    const organization = await this.findOrganizationByIdUseCase.execute(id);
    return this.organizationPresenter.toHTTP(organization);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing organization' })
  @ApiParam({ name: 'id', description: 'The ID of the organization to update' })
  @ApiResponse({
    status: 200,
    description: 'The organization has been successfully updated.',
    type: OrganizationResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.updateOrganizationUseCase.execute(
      id,
      updateDto,
    );
    return this.organizationPresenter.toHTTP(organization);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disable an organization' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the organization to disable',
  })
  @ApiResponse({
    status: 200,
    description: 'The organization has been successfully disabled.',
    type: Boolean,
  })
  async delete(@Param('id') id: string): Promise<boolean> {
    await this.deleteOrganizationUseCase.execute(id);
    return true;
  }

  @Get()
  @ApiOperation({ summary: 'Find all organizations' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Return all organizations.',
    type: PaginatedDto<OrganizationResponseDto>,
  })
  async findAll(
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
