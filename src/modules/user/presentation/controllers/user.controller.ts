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
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';

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

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiParam({ name: 'id', description: 'The ID of the user to update' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
    type: UserResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.updateUserUseCase.execute(id, updateUserDto);
      return UserPresenter.toHTTP(user);
    } catch (error) {
      throw error;
    }
  }

  @Get('active')
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
  @ApiOperation({ summary: 'Find a user by ID' })
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
  @ApiOperation({ summary: 'Disable a user' })
  @ApiParam({ name: 'id', description: 'The ID of the user to disable' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully disabled.',
    type: Boolean,
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
  @ApiOperation({ summary: 'Find all users' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Return all users.',
    type: PaginatedDto<UserResponseDto>,
  })
  async findAll(
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
