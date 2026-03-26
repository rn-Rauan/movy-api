import { ConflictException, Injectable } from "@nestjs/common";
import { UserRepository } from "../../domain/interfaces/user.repository";
import { CreateUserDto } from "../dto/create-user.dto";
import { User } from "../../domain/entities";
import { randomUUID } from "crypto";
import { HashProvider } from "src/shared/providers/interfaces/hash.interface";

@Injectable()
export class CreateUserUseCase{
    constructor(private readonly userRepository: UserRepository, private readonly hashProvider: HashProvider){ }

    async execute(userDto: CreateUserDto): Promise<User>{
        const userExists = await this.userRepository.findByEmail(userDto.email)

        if(userExists){
            throw new ConflictException("Email already exists");
        }

        const id = randomUUID()
        const passwordHash = await this.hashProvider.generateHash(userDto.password)

        const user = User.create({
            id: id,
            name: userDto.name,
            email: userDto.email,
            passwordHash: passwordHash,
            telephone: userDto.telephone
        })

        await this.userRepository.save(user);
        return user;
    }
}
