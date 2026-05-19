import { EmailVerificationToken } from 'src/modules/auth/domain/entities/email-verification-token.entity';
import { hashToken } from 'src/modules/auth/domain/entities/password-reset-token.entity';
import { InvalidOrExpiredVerificationTokenError } from 'src/modules/auth/domain/errors/auth.errors';
import { EmailVerificationTokenRepository } from 'src/modules/auth/domain/interfaces/email-verification-token.repository';
import { VerifyEmailUseCase } from 'src/modules/auth/application/use-cases/verify-email.use-case';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { makeUser } from '../../../user/factories/user.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tokenRepository = {
    findByTokenHash: jest.fn(),
    markUsed: jest.fn().mockResolvedValue(undefined),
  } as any as jest.Mocked<EmailVerificationTokenRepository>;

  const userRepository = {
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  } as any as jest.Mocked<UserRepository>;

  return { tokenRepository, userRepository };
}

// ── Tests ───────────────────────────────────────────────

const RAW_TOKEN = 'a8b9d3f0-1234-4abc-9def-000000000001';
const USER_ID = 'user-id-stub';

describe('VerifyEmailUseCase', () => {
  let sut: VerifyEmailUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new VerifyEmailUseCase(mocks.tokenRepository, mocks.userRepository);
  });

  describe('happy path', () => {
    it('should mark user email as verified and mark token used', async () => {
      // Arrange
      const user = makeUser({ id: USER_ID });
      const token = EmailVerificationToken.restore({
        id: 'token-id-1',
        userId: USER_ID,
        tokenHash: hashToken(RAW_TOKEN),
        expiresAt: new Date(Date.now() + 3600_000),
        usedAt: null,
        createdAt: new Date(),
      });
      mocks.tokenRepository.findByTokenHash.mockResolvedValue(token);
      mocks.userRepository.findById.mockResolvedValue(user);

      // Act
      await sut.execute(RAW_TOKEN);

      // Assert
      expect(mocks.tokenRepository.findByTokenHash).toHaveBeenCalledWith(
        hashToken(RAW_TOKEN),
      );
      expect(user.emailVerifiedAt).toBeInstanceOf(Date);
      expect(mocks.userRepository.update).toHaveBeenCalledWith(user);
      expect(mocks.tokenRepository.markUsed).toHaveBeenCalledWith('token-id-1');
    });
  });

  describe('error cases (all collapse into 400)', () => {
    it('should throw when token does not exist', async () => {
      mocks.tokenRepository.findByTokenHash.mockResolvedValue(null);

      await expect(sut.execute(RAW_TOKEN)).rejects.toThrow(
        InvalidOrExpiredVerificationTokenError,
      );
      expect(mocks.userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw when token is expired', async () => {
      const expired = EmailVerificationToken.restore({
        id: 'token-id-2',
        userId: USER_ID,
        tokenHash: hashToken(RAW_TOKEN),
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
        createdAt: new Date(),
      });
      mocks.tokenRepository.findByTokenHash.mockResolvedValue(expired);

      await expect(sut.execute(RAW_TOKEN)).rejects.toThrow(
        InvalidOrExpiredVerificationTokenError,
      );
      expect(mocks.userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw when token was already used', async () => {
      const used = EmailVerificationToken.restore({
        id: 'token-id-3',
        userId: USER_ID,
        tokenHash: hashToken(RAW_TOKEN),
        expiresAt: new Date(Date.now() + 3600_000),
        usedAt: new Date(),
        createdAt: new Date(),
      });
      mocks.tokenRepository.findByTokenHash.mockResolvedValue(used);

      await expect(sut.execute(RAW_TOKEN)).rejects.toThrow(
        InvalidOrExpiredVerificationTokenError,
      );
      expect(mocks.userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw when user is INACTIVE', async () => {
      const inactive = makeUser({ id: USER_ID });
      inactive.setStatus('INACTIVE');
      const token = EmailVerificationToken.restore({
        id: 'token-id-4',
        userId: USER_ID,
        tokenHash: hashToken(RAW_TOKEN),
        expiresAt: new Date(Date.now() + 3600_000),
        usedAt: null,
        createdAt: new Date(),
      });
      mocks.tokenRepository.findByTokenHash.mockResolvedValue(token);
      mocks.userRepository.findById.mockResolvedValue(inactive);

      await expect(sut.execute(RAW_TOKEN)).rejects.toThrow(
        InvalidOrExpiredVerificationTokenError,
      );
      expect(mocks.tokenRepository.markUsed).not.toHaveBeenCalled();
    });
  });
});
