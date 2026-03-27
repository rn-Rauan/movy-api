import { Controller, Post, Body, Put, Param, Get, Delete } from "@nestjs/common";
import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";
import { CreateUserDto } from "../../application/dto/create-user.dto";
import { UserResponseDto } from "../../application/dto/user-response.dto";
import { UpdateUserDto } from "../../application/dto/update-user.dto";
import { UpdateUserUseCase } from "../../application/use-cases/update-user.use-case";
import { FindUserByIdUseCase } from "../../application/use-cases/find-user-by-id.use-case";
import { DisableUserUseCase } from "../../application/use-cases/disable-user.use-case";
import { FindAllUsersUseCase } from "../../application/use-cases/find-all-users.use-case";

@Controller("users")
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

    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      telephone: user.telephone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto>{
    const user = await this.updateUserUseCase.execute(id, updateUserDto)
    
      return new UserResponseDto({
        id: user.id,
        name: user.name,
        email: user.email,
        telephone: user.telephone,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
  }

  @Get(":id")
  async findById(@Param("id") id: string): Promise<UserResponseDto>{
    const user = await this.findUserByIdUseCase.execute(id);

    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      telephone: user.telephone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  @Delete(":id")
  async disable(@Param("id") id: string): Promise<boolean>{
    await this.disableUserUseCase.execute(id);
    return true
  }

  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.findAllUsersUseCase.execute();
    return users.map(user => new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      telephone: user.telephone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }
}