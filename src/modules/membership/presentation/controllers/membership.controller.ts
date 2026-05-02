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
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/infrastructure/guards/jwt.guard';
import { RolesGuard } from 'src/shared/infrastructure/guards/roles.guard';
import { TenantFilterGuard } from 'src/shared/infrastructure/guards/tenant-filter.guard';
import { Roles } from 'src/shared/infrastructure/decorators/roles.decorator';
import { GetUser } from 'src/shared/infrastructure/decorators/get-user.decorator';
import type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';
import { RoleName } from 'src/shared';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  AssociateDriverDto,
  CreateMembershipDto,
  MembershipResponseDto,
  RoleResponseDto,
} from '../../application/dtos';
import { MembershipPresenter } from '../mappers/membership.presenter';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';
import {
  AssociateDriverToOrganizationUseCase,
  CreateMembershipUseCase,
  FindMembershipByCompositeKeyUseCase,
  FindMembershipsByUserUseCase,
  FindMembershipsByOrganizationUseCase,
  RemoveMembershipUseCase,
  RestoreMembershipUseCase,
} from '../../application/use-cases';
import { FindRoleByUserIdAndOrganizationIdUseCase } from '../../application/use-cases/find-role-by-user-and-organization.use-case';

/**
 * HTTP controller for membership management.
 *
 * @remarks
 * All endpoints require `JwtAuthGuard`. Admin-only endpoints additionally
 * require `RolesGuard(ADMIN)` + `TenantFilterGuard` to enforce org-scoping.
 *
 * Base path: `/memberships`
 *
 * | Method | Path | Guard | Use Case |
 * |--------|------|-------|----------|
 * | `GET` | `/memberships/me/role/:organizationId` | `RolesGuard(ADMIN, DRIVER)` | `FindRoleByUserIdAndOrganizationIdUseCase` |
 * | `POST` | `/memberships` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `CreateMembershipUseCase` |
 * | `POST` | `/memberships/driver` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `AssociateDriverToOrganizationUseCase` |
 * | `GET` | `/memberships/user/:userId` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `FindMembershipsByUserUseCase` |
 * | `GET` | `/memberships/organization/:organizationId` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `FindMembershipsByOrganizationUseCase` |
 * | `GET` | `/memberships/:userId/:roleId/:organizationId` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `FindMembershipByCompositeKeyUseCase` |
 * | `PATCH` | `/memberships/:userId/:roleId/:organizationId/restore` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `RestoreMembershipUseCase` |
 * | `DELETE` | `/memberships/:userId/:roleId/:organizationId` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `RemoveMembershipUseCase` |
 */
@ApiTags('memberships')
@Controller('memberships')
@UseGuards(JwtAuthGuard)
export class MembershipController {
  constructor(
    private readonly associateDriverToOrganizationUseCase: AssociateDriverToOrganizationUseCase,
    private readonly createMembershipUseCase: CreateMembershipUseCase,
    private readonly findMembershipByCompositeKeyUseCase: FindMembershipByCompositeKeyUseCase,
    private readonly findMembershipsByUserUseCase: FindMembershipsByUserUseCase,
    private readonly findMembershipsByOrganizationUseCase: FindMembershipsByOrganizationUseCase,
    private readonly removeMembershipUseCase: RemoveMembershipUseCase,
    private readonly restoreMembershipUseCase: RestoreMembershipUseCase,
    private readonly findRoleByUserIdAndOrganizationIdUseCase: FindRoleByUserIdAndOrganizationIdUseCase,
    private readonly membershipPresenter: MembershipPresenter,
  ) {}

  @Get('me/role/:organizationId')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.DRIVER)
  @ApiOperation({
    summary: 'Get the role of the authenticated user within an organization',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'The ID of the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the role of the current user in the organization.',
    type: RoleResponseDto,
  })
  async getMyRole(
    @Param('organizationId') organizationId: string,
    @GetUser() user: TenantContext,
  ): Promise<RoleResponseDto> {
    const role = await this.findRoleByUserIdAndOrganizationIdUseCase.execute({
      userId: user.userId,
      organizationId,
    });
    return new RoleResponseDto({ id: role.id, name: role.name });
  }

  @Post()
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Create a new membership (for ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'The membership has been successfully created.',
    type: MembershipResponseDto,
  })
  async create(
    @Body() createDto: CreateMembershipDto,
    @GetUser() user: TenantContext,
  ): Promise<MembershipResponseDto> {
    if (!user.organizationId) {
      throw new BadRequestException('No organization context found in token');
    }
    const membership = await this.createMembershipUseCase.execute(
      createDto,
      user.organizationId,
    );
    return this.membershipPresenter.toHTTP(membership);
  }

  @Post('driver')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary:
      '[ADMIN] Associate a driver to the organization via email + CNH verification',
  })
  @ApiResponse({
    status: 201,
    description: 'DRIVER membership created or restored.',
    type: MembershipResponseDto,
  })
  async associateDriver(
    @Body() dto: AssociateDriverDto,
    @GetUser() user: TenantContext,
  ): Promise<MembershipResponseDto> {
    if (!user.organizationId) {
      throw new BadRequestException('No organization context found in token');
    }
    const membership = await this.associateDriverToOrganizationUseCase.execute(
      dto,
      user.organizationId,
    );
    return this.membershipPresenter.toHTTP(membership);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Find all memberships for a user (for ADMIN)' })
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
    @GetUser() user: TenantContext,
  ): Promise<PaginatedDto<MembershipResponseDto>> {
    const organizationId = user.isDev ? undefined : user.organizationId;
    const paginatedResult = await this.findMembershipsByUserUseCase.execute(
      userId,
      { page, limit },
      organizationId,
    );

    return new PaginatedDto(
      this.membershipPresenter.toListHTTP(paginatedResult.data),
      paginatedResult.total,
      paginatedResult.page,
      paginatedResult.limit,
    );
  }

  @Get('organization/:organizationId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Find all memberships for an organization (for ADMIN)',
  })
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

    return new PaginatedDto(
      this.membershipPresenter.toListHTTP(paginatedResult.data),
      paginatedResult.total,
      paginatedResult.page,
      paginatedResult.limit,
    );
  }

  @Get(':userId/:roleId/:organizationId')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Find a membership by composite key (for ADMIN)' })
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
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Remove a membership (soft delete) (for ADMIN)' })
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
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Restore a removed membership (for ADMIN)' })
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
