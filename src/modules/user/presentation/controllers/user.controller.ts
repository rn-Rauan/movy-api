import { Controller, Post, Body } from "@nestjs/common";
import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";
import { CreateUserDto } from "../../application/dto/create-user.dto";
import { UserResponseDto } from "../../application/dto/user-response.dto";

@Controller("users")
export class UserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

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
}
