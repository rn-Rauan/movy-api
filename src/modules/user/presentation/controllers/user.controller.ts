import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Get,
  Delete,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { CreateUserDto } from '../../application/dto/create-user.dto';
import { UserResponseDto } from '../../application/dto/user-response.dto';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/find-user-by-id.use-case';
import { DisableUserUseCase } from '../../application/use-cases/disable-user.use-case';
import { FindAllUsersUseCase } from '../../application/use-cases/find-all-users.use-case';
import { UserPresenter } from '../mappers/user.presenter';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly disableUserUseCase: DisableUserUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.createUserUseCase.execute(createUserDto);

    return UserPresenter.toHTTP(user);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.updateUserUseCase.execute(id, updateUserDto);

    return UserPresenter.toHTTP(user);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.findUserByIdUseCase.execute(id);

    return UserPresenter.toHTTP(user);
  }

  @Delete(':id')
  async disable(@Param('id') id: string): Promise<boolean> {
    await this.disableUserUseCase.execute(id);
    return true;
  }

  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.findAllUsersUseCase.execute();
    return UserPresenter.toHTTPList(users);
  }
}
