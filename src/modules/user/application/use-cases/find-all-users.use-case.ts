import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../domain/interfaces/user.repository";
import { User } from "../../domain/entities";

@Injectable()
export class FindAllUsersUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(): Promise<User[]>{
        const users = await this.userRepository.findAll();
        return users || [];
    }
}