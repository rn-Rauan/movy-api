import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../domain/interfaces/user.repository";
import { InactiveUserError, UserNotFoundError } from "../../domain/entities/errors/user.errors";
import { Status } from "src/shared/domain/types/status.type";
import { User } from "../../domain/entities";

@Injectable()
export class DisableUserUseCase {
    
    constructor(private readonly userRepository: UserRepository) {}

    async execute(userId: string): Promise<User>{
        const user = await this.userRepository.findById(userId);
        if(!user){
            throw new UserNotFoundError(userId);
        } 
        if(user.status == "INACTIVE"){
            throw new InactiveUserError(user.id);
        }

        user.setStatus("INACTIVE" as Status);
        await this.userRepository.update(user);
        return user;
    }
}