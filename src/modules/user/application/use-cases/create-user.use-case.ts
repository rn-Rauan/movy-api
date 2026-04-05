import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../../domain/entities';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';
import { UserEmailAlreadyExistsError } from '../../domain/entities/errors/user.errors';
import { UserRepository } from '../../domain/interfaces/user.repository';
import { PasswordHash, UserName } from '../../domain/entities/value-objects';
import { Email, Telephone } from 'src/shared/domain/entities/value-objects';
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashProvider: HashProvider,
  ) {}

  async execute(userDto: CreateUserDto): Promise<User> {
    const userExists = await this.userRepository.findByEmail(userDto.email);

    if (userExists) {
      throw new UserEmailAlreadyExistsError(userDto.email);
    }

    const id = crypto.randomUUID();
    const passwordHash = await this.hashProvider.generateHash(userDto.password);

    const user = User.create({
      id: id,
      name: UserName.create(userDto.name),
      email: Email.create(userDto.email),
      passwordHash: PasswordHash.create(passwordHash),
      telephone: Telephone.create(userDto.telephone),
    });

    await this.userRepository.save(user);
    return user;
  }
}
