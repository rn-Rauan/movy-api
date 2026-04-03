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
} from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { CreateUserDto } from '../../application/dto/create-user.dto';
import { UserResponseDto } from '../../application/dto/user-response.dto';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/find-user-by-id.use-case';
import { DisableUserUseCase } from '../../application/use-cases/disable-user.use-case';
import { FindAllActiveUsersUseCase } from '../../application/use-cases/find-all-active-users.use-case';
import { UserPresenter } from '../mappers/user.presenter';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';
import { FindAllUsersUseCase } from '../../application/use-cases/find-all-users.use-case';

@Controller('users')
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
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.createUserUseCase.execute(createUserDto);
      return UserPresenter.toHTTP(user);
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
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
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    try {
      const user = await this.findUserByIdUseCase.execute(id);
      return UserPresenter.toHTTP(user);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  async disable(@Param('id') id: string): Promise<boolean> {
    try {
      await this.disableUserUseCase.execute(id);
      return true;
    } catch (error) {
      throw error;
    }
  }

  @Get()
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
