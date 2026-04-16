import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadService } from 'src/modules/auth/application/services/jwt-payload.service';
import { LoginUseCase } from 'src/modules/auth/application/use-cases';
import { UserNotFoundError } from 'src/modules/user/domain/entities/errors/user.errors';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';
import { makeUser } from '../../../user/factories/user.factory';
import { makeJwtPayload } from '../../factories/jwt-payload.factory';

// ── Mock helpers ────────────────────────────────────────────

function makeMocks() {
  const userRepository = {
    findByEmail: jest.fn(),
  } as any as jest.Mocked<UserRepository>;
  const hashProvider = {
    compare: jest.fn(),
  } as any as jest.Mocked<HashProvider>;
  const jwtService = { sign: jest.fn() } as any as jest.Mocked<JwtService>;
  const jwtPayloadService = {
    enrichPayload: jest.fn(),
  } as any as jest.Mocked<JwtPayloadService>;

  return { userRepository, hashProvider, jwtService, jwtPayloadService };
}

function setupHappyPath(
  mocks: ReturnType<typeof makeMocks>,
  user: ReturnType<typeof makeUser>,
) {
  mocks.userRepository.findByEmail.mockResolvedValue(user);
  mocks.hashProvider.compare.mockResolvedValue(true);
  mocks.jwtPayloadService.enrichPayload.mockResolvedValue(
    makeJwtPayload({ sub: user.id, email: user.email }),
  );
  mocks.jwtService.sign
    .mockReturnValueOnce('access-token-stub')
    .mockReturnValueOnce('refresh-token-stub');
}

// ── Tests ───────────────────────────────────────────────────

describe('LoginUseCase', () => {
  let sut: LoginUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  const validInput = { email: 'jacinto@email.com', password: 'password123' };

  beforeEach(() => {
    mocks = makeMocks();
    sut = new LoginUseCase(
      mocks.userRepository,
      mocks.hashProvider,
      mocks.jwtService,
      mocks.jwtPayloadService,
    );
  });

  describe('happy path', () => {
    it('should return TokenResponseDto with access and refresh tokens', async () => {
      // Arrange
      const user = makeUser({ email: validInput.email });
      setupHappyPath(mocks, user);

      // Act
      const result = await sut.execute(validInput);

      // Assert
      expect(result.accessToken).toBe('access-token-stub');
      expect(result.refreshToken).toBe('refresh-token-stub');
      expect(result.user).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    });

    it('should call dependencies in correct order with correct args', async () => {
      // Arrange
      const user = makeUser({ email: validInput.email });
      setupHappyPath(mocks, user);

      // Act
      await sut.execute(validInput);

      // Assert
      expect(mocks.userRepository.findByEmail).toHaveBeenCalledWith(
        validInput.email,
      );
      expect(mocks.hashProvider.compare).toHaveBeenCalledWith(
        validInput.password,
        user.passwordHash,
      );
      expect(mocks.jwtPayloadService.enrichPayload).toHaveBeenCalledWith(
        user.id,
      );
      expect(mocks.jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('error cases', () => {
    it('should throw UserNotFoundError when email does not exist', async () => {
      // Arrange
      mocks.userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(validInput)).rejects.toThrow(UserNotFoundError);
      expect(mocks.hashProvider.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is INACTIVE', async () => {
      // Arrange
      const inactiveUser = makeUser({ email: validInput.email });
      inactiveUser.setStatus('INACTIVE');
      mocks.userRepository.findByEmail.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(sut.execute(validInput)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mocks.hashProvider.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      // Arrange
      const user = makeUser({ email: validInput.email });
      mocks.userRepository.findByEmail.mockResolvedValue(user);
      mocks.hashProvider.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(sut.execute(validInput)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mocks.jwtPayloadService.enrichPayload).not.toHaveBeenCalled();
    });
  });
});
