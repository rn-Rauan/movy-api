import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadService } from 'src/modules/auth/application/services/jwt-payload.service';
import { RefreshTokenUseCase } from 'src/modules/auth/application/use-cases/refresh-token.use-case';
import { RefreshTokenRepository } from 'src/modules/auth/domain/interfaces/refresh-token-repository.interface';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { makeUser } from '../../../user/factories/user.factory';
import { makeJwtPayload } from '../../factories/jwt-payload.factory';

// ── Mock helpers ─────────────────────────────────────────────

function makeMocks() {
  const jwtService = {
    verify: jest.fn(),
    sign: jest.fn(),
  } as any as jest.Mocked<JwtService>;

  const userRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<UserRepository>;

  const jwtPayloadService = {
    enrichPayload: jest.fn(),
  } as any as jest.Mocked<JwtPayloadService>;

  const refreshTokenRepository = {
    findByJti: jest.fn(),
    deleteByJti: jest.fn(),
    save: jest.fn(),
  } as any as jest.Mocked<RefreshTokenRepository>;

  return {
    jwtService,
    userRepository,
    jwtPayloadService,
    refreshTokenRepository,
  };
}

function setupHappyPath(
  mocks: ReturnType<typeof makeMocks>,
  user: ReturnType<typeof makeUser>,
) {
  // makeJwtPayload has no jti, so the JTI DB check is skipped in the use case
  mocks.jwtService.verify.mockReturnValue(
    makeJwtPayload({ sub: user.id, email: user.email }),
  );
  mocks.userRepository.findById.mockResolvedValue(user);
  mocks.jwtPayloadService.enrichPayload.mockResolvedValue(
    makeJwtPayload({ sub: user.id, email: user.email }),
  );
  mocks.refreshTokenRepository.save.mockResolvedValue(undefined);
  mocks.jwtService.sign
    .mockReturnValueOnce('new-access-token')
    .mockReturnValueOnce('new-refresh-token');
}

// ── Tests ─────────────────────────────────────────────────────

describe('RefreshTokenUseCase', () => {
  let sut: RefreshTokenUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  const REFRESH_TOKEN = 'valid-refresh-token-stub';

  beforeEach(() => {
    mocks = makeMocks();
    sut = new RefreshTokenUseCase(
      mocks.jwtService,
      mocks.userRepository,
      mocks.jwtPayloadService,
      mocks.refreshTokenRepository,
    );
  });

  describe('happy path', () => {
    it('should return new access token, refresh token, and user info', async () => {
      // Arrange
      const user = makeUser();
      setupHappyPath(mocks, user);

      // Act
      const result = await sut.execute(REFRESH_TOKEN);

      // Assert
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.user).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    });

    it('should call dependencies in correct order with correct args', async () => {
      // Arrange
      const user = makeUser();
      setupHappyPath(mocks, user);

      // Act
      await sut.execute(REFRESH_TOKEN);

      // Assert
      expect(mocks.jwtService.verify).toHaveBeenCalledWith(REFRESH_TOKEN);
      expect(mocks.userRepository.findById).toHaveBeenCalledWith(user.id);
      expect(mocks.jwtPayloadService.enrichPayload).toHaveBeenCalledWith(
        user.id,
      );
      expect(mocks.jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should sign the refresh token with expiresIn 7d and a jti', async () => {
      // Arrange
      const user = makeUser();
      setupHappyPath(mocks, user);
      const enrichedPayload = makeJwtPayload({ sub: user.id });
      mocks.jwtPayloadService.enrichPayload.mockResolvedValue(enrichedPayload);

      // Act
      await sut.execute(REFRESH_TOKEN);

      // Assert
      expect(mocks.jwtService.sign).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          ...enrichedPayload,
          jti: expect.any(String) as unknown as string,
        }),
        { expiresIn: '7d' },
      );
    });
  });

  describe('error cases', () => {
    it('should throw UnauthorizedException when token signature is invalid', async () => {
      // Arrange
      mocks.jwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      // Act & Assert
      await expect(sut.execute('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mocks.userRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      // Arrange
      mocks.jwtService.verify.mockImplementation(() => {
        const err = new Error('jwt expired');
        err.name = 'TokenExpiredError';
        throw err;
      });

      // Act & Assert
      await expect(sut.execute(REFRESH_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mocks.userRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      const user = makeUser();
      mocks.jwtService.verify.mockReturnValue(makeJwtPayload({ sub: user.id }));
      mocks.userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(REFRESH_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mocks.jwtPayloadService.enrichPayload).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is INACTIVE', async () => {
      // Arrange
      const user = makeUser();
      user.setStatus('INACTIVE');
      mocks.jwtService.verify.mockReturnValue(makeJwtPayload({ sub: user.id }));
      mocks.userRepository.findById.mockResolvedValue(user);

      // Act & Assert
      await expect(sut.execute(REFRESH_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mocks.jwtPayloadService.enrichPayload).not.toHaveBeenCalled();
    });
  });
});
