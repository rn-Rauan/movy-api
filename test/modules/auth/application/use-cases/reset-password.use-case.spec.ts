import { JwtService } from '@nestjs/jwt';
import { JwtPayloadService } from 'src/modules/auth/application/services/jwt-payload.service';
import { ResetPasswordUseCase } from 'src/modules/auth/application/use-cases/reset-password.use-case';
import {
  PasswordResetToken,
  hashToken,
} from 'src/modules/auth/domain/entities/password-reset-token.entity';
import { InvalidOrExpiredResetTokenError } from 'src/modules/auth/domain/errors/auth.errors';
import { PasswordResetTokenRepository } from 'src/modules/auth/domain/interfaces/password-reset-token.repository';
import { RefreshTokenRepository } from 'src/modules/auth/domain/interfaces/refresh-token-repository.interface';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';
import { makeJwtPayload } from '../../factories/jwt-payload.factory';
import { makeUser } from '../../../user/factories/user.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const userRepository = {
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  } as any as jest.Mocked<UserRepository>;

  const tokenRepository = {
    findByTokenHash: jest.fn(),
    markUsed: jest.fn().mockResolvedValue(undefined),
  } as any as jest.Mocked<PasswordResetTokenRepository>;

  const refreshTokenRepository = {
    deleteByUserId: jest.fn().mockResolvedValue(undefined),
    save: jest.fn().mockResolvedValue(undefined),
  } as any as jest.Mocked<RefreshTokenRepository>;

  const hashProvider = {
    generateHash: jest.fn().mockResolvedValue('new-bcrypt-hash'),
  } as any as jest.Mocked<HashProvider>;

  const jwtPayloadService = {
    enrichPayload: jest.fn(),
  } as any as jest.Mocked<JwtPayloadService>;

  const jwtService = { sign: jest.fn() } as any as jest.Mocked<JwtService>;

  return {
    userRepository,
    tokenRepository,
    refreshTokenRepository,
    hashProvider,
    jwtPayloadService,
    jwtService,
  };
}

function makeValidResetToken(
  userId: string,
  rawToken: string,
): PasswordResetToken {
  return PasswordResetToken.restore({
    id: 'reset-token-1',
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + 3600_000),
    usedAt: null,
    createdAt: new Date(),
  });
}

// ── Tests ───────────────────────────────────────────────

const RAW_TOKEN = 'b7c2d1e8-4500-4abc-aaaa-000000000001';
const NEW_PASSWORD = 'newStrongP@ss1';
const USER_ID = 'user-id-stub';

describe('ResetPasswordUseCase', () => {
  let sut: ResetPasswordUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new ResetPasswordUseCase(
      mocks.userRepository,
      mocks.tokenRepository,
      mocks.refreshTokenRepository,
      mocks.hashProvider,
      mocks.jwtPayloadService,
      mocks.jwtService,
    );
  });

  describe('happy path', () => {
    it('should reset password, revoke sessions, and return fresh tokens', async () => {
      // Arrange
      const user = makeUser({ id: USER_ID });
      const token = makeValidResetToken(USER_ID, RAW_TOKEN);
      mocks.tokenRepository.findByTokenHash.mockResolvedValue(token);
      mocks.userRepository.findById.mockResolvedValue(user);
      mocks.jwtPayloadService.enrichPayload.mockResolvedValue(
        makeJwtPayload({ sub: USER_ID, email: user.email }),
      );
      mocks.jwtService.sign
        .mockReturnValueOnce('access-token-stub')
        .mockReturnValueOnce('refresh-token-stub');

      // Act
      const result = await sut.execute(RAW_TOKEN, NEW_PASSWORD);

      // Assert — side effects in order
      expect(mocks.hashProvider.generateHash).toHaveBeenCalledWith(
        NEW_PASSWORD,
      );
      expect(mocks.userRepository.update).toHaveBeenCalledWith(user);
      expect(mocks.tokenRepository.markUsed).toHaveBeenCalledWith(
        'reset-token-1',
      );
      expect(mocks.refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith(
        USER_ID,
      );
      expect(mocks.refreshTokenRepository.save).toHaveBeenCalledTimes(1);

      // Assert — response
      expect(result.accessToken).toBe('access-token-stub');
      expect(result.refreshToken).toBe('refresh-token-stub');
      expect(result.user.id).toBe(USER_ID);
    });
  });

  describe('error cases (all collapse into 400)', () => {
    it('should throw when token does not exist', async () => {
      mocks.tokenRepository.findByTokenHash.mockResolvedValue(null);

      await expect(sut.execute(RAW_TOKEN, NEW_PASSWORD)).rejects.toThrow(
        InvalidOrExpiredResetTokenError,
      );
      expect(mocks.userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw when token is expired', async () => {
      const expired = PasswordResetToken.restore({
        id: 'reset-token-2',
        userId: USER_ID,
        tokenHash: hashToken(RAW_TOKEN),
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
        createdAt: new Date(),
      });
      mocks.tokenRepository.findByTokenHash.mockResolvedValue(expired);

      await expect(sut.execute(RAW_TOKEN, NEW_PASSWORD)).rejects.toThrow(
        InvalidOrExpiredResetTokenError,
      );
      expect(mocks.userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw when token was already used', async () => {
      const used = PasswordResetToken.restore({
        id: 'reset-token-3',
        userId: USER_ID,
        tokenHash: hashToken(RAW_TOKEN),
        expiresAt: new Date(Date.now() + 3600_000),
        usedAt: new Date(),
        createdAt: new Date(),
      });
      mocks.tokenRepository.findByTokenHash.mockResolvedValue(used);

      await expect(sut.execute(RAW_TOKEN, NEW_PASSWORD)).rejects.toThrow(
        InvalidOrExpiredResetTokenError,
      );
    });

    it('should throw when user is INACTIVE (do not signal account state)', async () => {
      const inactive = makeUser({ id: USER_ID });
      inactive.setStatus('INACTIVE');
      const token = makeValidResetToken(USER_ID, RAW_TOKEN);
      mocks.tokenRepository.findByTokenHash.mockResolvedValue(token);
      mocks.userRepository.findById.mockResolvedValue(inactive);

      await expect(sut.execute(RAW_TOKEN, NEW_PASSWORD)).rejects.toThrow(
        InvalidOrExpiredResetTokenError,
      );
      expect(mocks.userRepository.update).not.toHaveBeenCalled();
      expect(mocks.tokenRepository.markUsed).not.toHaveBeenCalled();
    });
  });
});
