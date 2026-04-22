import { CreateUserUseCase } from 'src/modules/user/application/use-cases/create-user.use-case';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';
import { UserEmailAlreadyExistsError } from 'src/modules/user/domain/entities/errors/user.errors';
import { CreateUserDto } from 'src/modules/user/application/dtos/create-user.dto';
import { makeUser } from '../../factories/user.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const userRepository = {
    findByEmail: jest.fn(),
    save: jest.fn(),
  } as any as jest.Mocked<UserRepository>;

  const hashProvider = {
    generateHash: jest.fn(),
  } as any as jest.Mocked<HashProvider>;

  return { userRepository, hashProvider };
}

const validDto: CreateUserDto = {
  name: 'João Silva',
  email: 'joao@email.com',
  password: 'password123',
  telephone: '9999999999',
};

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  mocks.userRepository.findByEmail.mockResolvedValue(null);
  mocks.hashProvider.generateHash.mockResolvedValue('hashed-password');
  mocks.userRepository.save.mockResolvedValue(undefined);
}

// ── Tests ───────────────────────────────────────────────

describe('CreateUserUseCase', () => {
  let sut: CreateUserUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CreateUserUseCase(mocks.userRepository, mocks.hashProvider);
  });

  describe('happy path', () => {
    it('should create and return a new user', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(validDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(validDto.email);
    });

    it('should hash the password and call save once', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(validDto);

      // Assert
      expect(mocks.hashProvider.generateHash).toHaveBeenCalledWith(
        validDto.password,
      );
      expect(mocks.userRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('error — email already exists', () => {
    it('should throw UserEmailAlreadyExistsError when email is taken', async () => {
      // Arrange
      mocks.userRepository.findByEmail.mockResolvedValue(
        makeUser({ email: validDto.email }),
      );

      // Act & Assert
      await expect(sut.execute(validDto)).rejects.toThrow(
        UserEmailAlreadyExistsError,
      );
      expect(mocks.hashProvider.generateHash).not.toHaveBeenCalled();
    });
  });
});
