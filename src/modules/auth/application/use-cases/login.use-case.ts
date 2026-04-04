import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../../user/domain/interfaces/user.repository';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';
import { LoginDto, TokenResponseDto } from '../dtos';
import { UserNotFoundError } from '../../../user/domain/entities/errors/user.errors';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashProvider: HashProvider,
    private readonly jwtService: JwtService,
  ) {}

  async execute(loginDto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UserNotFoundError(loginDto.email);
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await this.hashProvider.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}