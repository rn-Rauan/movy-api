import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Get,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateUserDto } from '../../application/dto/create-user.dto';
import { UserResponseDto } from '../../application/dto/user-response.dto';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { UserPresenter } from '../mappers/user.presenter';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';
import {
  CreateUserUseCase,
  UpdateUserUseCase,
  FindUserByIdUseCase,
  DisableUserUseCase,
  FindAllActiveUsersUseCase,
  FindAllUsersUseCase,
} from '../../application/use-cases';
import { JwtAuthGuard } from 'src/shared/infrastructure/guards/jwt.guard';
import { GetTenantContext } from 'src/shared/infrastructure/decorators/get-tenant-context.decorator';
import { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';
import { RolesGuard } from 'src/shared/infrastructure/guards/roles.guard';
import { TenantFilterGuard } from 'src/shared/infrastructure/guards/tenant-filter.guard';
import { Roles } from 'src/shared/infrastructure/decorators/roles.decorator';
import { Dev, RoleName } from 'src/shared';
import { DevGuard } from 'src/shared/infrastructure/guards/dev.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly disableUserUseCase: DisableUserUseCase,
    private readonly findAllActiveUsersUseCase: FindAllActiveUsersUseCase,
    private readonly findAllUserUseCase: FindAllUsersUseCase,
  ) {}

  @Post()
  @UseGuards(RolesGuard, TenantFilterGuard)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: UserResponseDto,
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.createUserUseCase.execute(createUserDto);
      return UserPresenter.toHTTP(user);
    } catch (error) {
      throw error;
    }
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Return current user profile.',
    type: UserResponseDto,
  })
  async getMe(
    @GetTenantContext() context: TenantContext,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.findUserByIdUseCase.execute(context.userId);
      return UserPresenter.toHTTP(user);
    } catch (error) {
      throw error;
    }
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
    type: UserResponseDto,
  })
  async updateMe(
    @GetTenantContext() context: TenantContext,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.updateUserUseCase.execute(
        context.userId,
        updateUserDto,
      );
      return UserPresenter.toHTTP(user);
    } catch (error) {
      throw error;
    }
  }

  @Delete('me')
  @ApiOperation({ summary: 'Disable current user account' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully disabled.',
  })
  async disableMe(
    @GetTenantContext() context: TenantContext,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.disableUserUseCase.execute(context.userId);
      return { success: true, message: 'User account disabled' };
    } catch (error) {
      throw error;
    }
  }

  @Get('active')
  @UseGuards(DevGuard)
  @Dev()
  @ApiOperation({ summary: 'Find all active users' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Return all active users.',
    type: PaginatedDto<UserResponseDto>,
  })
  async findAllActive(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<UserResponseDto>> {
    try {
      const paginatedResult = await this.findAllActiveUsersUseCase.execute({
        page,
        limit,
      });

      const data = paginatedResult.data.map(
        (user) =>
          new UserResponseDto({
            id: user.id,
            name: user.name,
            email: user.email,
            telephone: user.telephone,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }),
      );

      return new PaginatedDto(
        data,
        paginatedResult.total,
        paginatedResult.page,
        paginatedResult.limit,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Find a user by ID - DEPRECATED, use /users/me',
    description:
      'This endpoint is deprecated. Please use GET /users/me instead.',
  })
  @ApiParam({ name: 'id', description: 'The ID of the user to find' })
  @ApiResponse({
    status: 200,
    description: 'Return the user.',
    type: UserResponseDto,
  })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    try {
      const user = await this.findUserByIdUseCase.execute(id);
      return UserPresenter.toHTTP(user);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Disable a user - DEPRECATED, use /users/me',
    description:
      'This endpoint is deprecated. Please use DELETE /users/me instead.',
  })
  @ApiParam({ name: 'id', description: 'The ID of the user to disable' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully disabled.',
  })
  async disable(@Param('id') id: string): Promise<boolean> {
    try {
      await this.disableUserUseCase.execute(id);
      return true;
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @UseGuards(DevGuard)
  @Dev()
  @ApiOperation({ summary: 'Find all users' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Return all users.',
    type: PaginatedDto<UserResponseDto>,
  })
  async findAll(
    @GetTenantContext() context: TenantContext,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<UserResponseDto>> {
    try {
      const paginatedResult = await this.findAllUserUseCase.execute({
        page,
        limit,
      });

      const data = paginatedResult.data.map(
        (user) =>
          new UserResponseDto({
            id: user.id,
            name: user.name,
            email: user.email,
            telephone: user.telephone,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }),
      );

      return new PaginatedDto(
        data,
        paginatedResult.total,
        paginatedResult.page,
        paginatedResult.limit,
      );
    } catch (error) {
      throw error;
    }
  }
}
