import { ForgotPasswordUseCase } from 'src/modules/auth/application/use-cases/forgot-password.use-case';
import { PasswordResetTokenRepository } from 'src/modules/auth/domain/interfaces/password-reset-token.repository';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { EmailService } from 'src/shared/infrastructure/email/email.service.interface';
import { makeUser } from '../../../user/factories/user.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const userRepository = {
    findByEmail: jest.fn(),
  } as any as jest.Mocked<UserRepository>;

  const tokenRepository = {
    save: jest.fn().mockResolvedValue(undefined),
  } as any as jest.Mocked<PasswordResetTokenRepository>;

  const emailService = {
    send: jest.fn().mockResolvedValue(undefined),
  } as any as jest.Mocked<EmailService>;

  return { userRepository, tokenRepository, emailService };
}

// ── Tests ───────────────────────────────────────────────

describe('ForgotPasswordUseCase', () => {
  let sut: ForgotPasswordUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new ForgotPasswordUseCase(
      mocks.userRepository,
      mocks.tokenRepository,
      mocks.emailService,
    );
  });

  describe('when email maps to an ACTIVE user', () => {
    it('should issue a reset token and send the email', async () => {
      // Arrange
      const user = makeUser({ email: 'someone@stub.com' });
      mocks.userRepository.findByEmail.mockResolvedValue(user);

      // Act
      await sut.execute('someone@stub.com');

      // Assert
      expect(mocks.tokenRepository.save).toHaveBeenCalledTimes(1);
      expect(mocks.emailService.send).toHaveBeenCalledTimes(1);
      const [to, subject, body, metadata] =
        mocks.emailService.send.mock.calls[0];
      expect(to).toBe(user.email);
      expect(subject).toContain('Recuperação');
      expect(body).toContain('Token:');
      expect(metadata).toEqual(
        expect.objectContaining({ kind: 'password_reset', userId: user.id }),
      );
    });
  });

  describe('constant-response (no-op) cases', () => {
    it('should resolve without sending when email is not registered', async () => {
      mocks.userRepository.findByEmail.mockResolvedValue(null);

      await expect(sut.execute('ghost@stub.com')).resolves.toBeUndefined();
      expect(mocks.tokenRepository.save).not.toHaveBeenCalled();
      expect(mocks.emailService.send).not.toHaveBeenCalled();
    });

    it('should resolve without sending when user is INACTIVE', async () => {
      const inactive = makeUser({ email: 'inactive@stub.com' });
      inactive.setStatus('INACTIVE');
      mocks.userRepository.findByEmail.mockResolvedValue(inactive);

      await expect(sut.execute('inactive@stub.com')).resolves.toBeUndefined();
      expect(mocks.tokenRepository.save).not.toHaveBeenCalled();
      expect(mocks.emailService.send).not.toHaveBeenCalled();
    });
  });
});
