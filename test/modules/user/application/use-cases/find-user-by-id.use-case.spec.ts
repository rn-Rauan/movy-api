import { FindUserByIdUseCase } from 'src/modules/user/application/use-cases/find-user-by-id.use-case';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { UserNotFoundError } from 'src/modules/user/domain/entities/errors/user.errors';
import { makeUser } from '../../factories/user.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const userRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<UserRepository>;

  return { userRepository };
}

// ── Tests ───────────────────────────────────────────────

const USER_ID = 'user-id-stub';

describe('FindUserByIdUseCase', () => {
  let sut: FindUserByIdUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindUserByIdUseCase(mocks.userRepository);
  });

  describe('happy path', () => {
    it('should find and return the active user', async () => {
      // Arrange
      const user = makeUser({ id: USER_ID });
      mocks.userRepository.findById.mockResolvedValue(user);

      // Act
      const result = await sut.execute(USER_ID);

      // Assert
      expect(result).toBe(user);
    });
  });

  describe('error — not found', () => {
    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      mocks.userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(USER_ID)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw UserNotFoundError when user is inactive', async () => {
      // Arrange
      const inactiveUser = makeUser({ id: USER_ID });
      inactiveUser.setStatus('INACTIVE');
      mocks.userRepository.findById.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(sut.execute(USER_ID)).rejects.toThrow(UserNotFoundError);
    });
  });
});
