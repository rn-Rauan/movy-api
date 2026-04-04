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
} from '@nestjs/common';
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



@Controller('organizations')
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
  async create(
    @Body() createDto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.createOrganizationUseCase.execute(
      createDto,
    );
    return this.organizationPresenter.toHTTP(organization);
  }

  @Get('active')
  async findAllActive(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<OrganizationResponseDto>> {
    const paginatedResult = await this.findAllActiveOrganizationsUseCase.execute(
      {
        page,
        limit,
      },
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

  @Get(':id')
  async findById(
    @Param('id') id: string,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.findOrganizationByIdUseCase.execute(id);
    return this.organizationPresenter.toHTTP(organization);
  }

  @Put(':id')
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
  async delete(@Param('id') id: string): Promise<boolean> {
    await this.deleteOrganizationUseCase.execute(id);
    return true;
  }

  @Get()
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
 