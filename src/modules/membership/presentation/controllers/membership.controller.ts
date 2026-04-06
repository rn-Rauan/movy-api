import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Patch,
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
  CreateMembershipDto,
  MembershipResponseDto,
} from '../../application/dtos';
import { MembershipPresenter } from '../mappers/membership.presenter';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';
import {
  CreateMembershipUseCase,
  FindMembershipByCompositeKeyUseCase,
  FindMembershipsByUserUseCase,
  FindMembershipsByOrganizationUseCase,
  RemoveMembershipUseCase,
  RestoreMembershipUseCase,
} from '../../application/use-cases';

@ApiTags('memberships')
@Controller('memberships')
@UseGuards(JwtAuthGuard)
export class MembershipController {
  constructor(
    private readonly createMembershipUseCase: CreateMembershipUseCase,
    private readonly findMembershipByCompositeKeyUseCase: FindMembershipByCompositeKeyUseCase,
    private readonly findMembershipsByUserUseCase: FindMembershipsByUserUseCase,
    private readonly findMembershipsByOrganizationUseCase: FindMembershipsByOrganizationUseCase,
    private readonly removeMembershipUseCase: RemoveMembershipUseCase,
    private readonly restoreMembershipUseCase: RestoreMembershipUseCase,
    private readonly membershipPresenter: MembershipPresenter,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new membership' })
  @ApiResponse({
    status: 201,
    description: 'The membership has been successfully created.',
    type: MembershipResponseDto,
  })
  async create(
    @Body() createDto: CreateMembershipDto,
  ): Promise<MembershipResponseDto> {
    const membership = await this.createMembershipUseCase.execute(createDto);
    return this.membershipPresenter.toHTTP(membership);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Find all memberships for a user' })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Return user memberships.',
    type: PaginatedDto<MembershipResponseDto>,
  })
  async findByUser(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<MembershipResponseDto>> {
    const paginatedResult = await this.findMembershipsByUserUseCase.execute(
      userId,
      { page, limit },
    );

    const data = paginatedResult.data.map((m) =>
      this.membershipPresenter.toHTTP(m),
    );

    return new PaginatedDto(
      data,
      paginatedResult.total,
      paginatedResult.page,
      paginatedResult.limit,
    );
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Find all memberships for an organization' })
  @ApiParam({
    name: 'organizationId',
    description: 'The ID of the organization',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Return organization memberships.',
    type: PaginatedDto<MembershipResponseDto>,
  })
  async findByOrganization(
    @Param('organizationId') organizationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<MembershipResponseDto>> {
    const paginatedResult =
      await this.findMembershipsByOrganizationUseCase.execute(organizationId, {
        page,
        limit,
      });

    const data = paginatedResult.data.map((m) =>
      this.membershipPresenter.toHTTP(m),
    );

    return new PaginatedDto(
      data,
      paginatedResult.total,
      paginatedResult.page,
      paginatedResult.limit,
    );
  }

  @Get(':userId/:roleId/:organizationId')
  @ApiOperation({ summary: 'Find a membership by composite key' })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiParam({ name: 'roleId', description: 'The ID of the role' })
  @ApiParam({
    name: 'organizationId',
    description: 'The ID of the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the membership.',
    type: MembershipResponseDto,
  })
  async findByCompositeKey(
    @Param('userId') userId: string,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('organizationId') organizationId: string,
  ): Promise<MembershipResponseDto> {
    const membership = await this.findMembershipByCompositeKeyUseCase.execute(
      userId,
      roleId,
      organizationId,
    );
    return this.membershipPresenter.toHTTP(membership);
  }

  @Delete(':userId/:roleId/:organizationId')
  @ApiOperation({ summary: 'Remove a membership (soft delete)' })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiParam({ name: 'roleId', description: 'The ID of the role' })
  @ApiParam({
    name: 'organizationId',
    description: 'The ID of the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'The membership has been successfully removed.',
    type: Boolean,
  })
  async remove(
    @Param('userId') userId: string,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('organizationId') organizationId: string,
  ): Promise<boolean> {
    await this.removeMembershipUseCase.execute(userId, roleId, organizationId);
    return true;
  }

  @Patch(':userId/:roleId/:organizationId/restore')
  @ApiOperation({ summary: 'Restore a removed membership' })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiParam({ name: 'roleId', description: 'The ID of the role' })
  @ApiParam({
    name: 'organizationId',
    description: 'The ID of the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'The membership has been successfully restored.',
    type: Boolean,
  })
  async restore(
    @Param('userId') userId: string,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('organizationId') organizationId: string,
  ): Promise<boolean> {
    await this.restoreMembershipUseCase.execute(userId, roleId, organizationId);
    return true;
  }
}
