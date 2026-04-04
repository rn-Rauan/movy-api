import { Body, Controller, Post } from '@nestjs/common';
import { CreateOrganizationUseCase } from '../../application/use-cases/create-organization.use-case';
import { CreateOrganizationDto, OrganizationResponseDto } from '../../application/dtos';
import { OrganizationPresenter } from '../mappers/organization.mapper';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly organizationPresenter: OrganizationPresenter,
  ) {}

  @Post()
  async create(@Body() createDto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    const organization = await this.createOrganizationUseCase.execute(createDto);
    return this.organizationPresenter.toHTTP(organization);
  }
}
 