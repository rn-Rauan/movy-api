import { FindDriverNameByIdUseCase } from 'src/modules/driver/application/use-cases/find-driver-name-by-id.use-case';
import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { DriverNotFoundError } from 'src/modules/driver/domain/entities/errors/driver.errors';
import { makeDriver } from '../../factories/driver.factory';
import { makeUser } from 'test/modules/user/factories/user.factory';

// ── Mock helpers ────────────────────────────────────────────

function makeMocks() {
  const driverRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<DriverRepository>;

  const userRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<UserRepository>;

  return { driverRepository, userRepository };
}

function setupHappyPath(
  mocks: ReturnType<typeof makeMocks>,
  driverOverrides: Parameters<typeof makeDriver>[0] = {},
  userName = 'João Silva',
) {
  const driver = makeDriver(driverOverrides);
  const user = makeUser({ id: driver.userId, name: userName });

  mocks.driverRepository.findById.mockResolvedValue(driver);
  mocks.userRepository.findById.mockResolvedValue(user);

  return { driver, user };
}

// ── Tests ───────────────────────────────────────────────────

describe('FindDriverNameByIdUseCase', () => {
  let sut: FindDriverNameByIdUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  const DRIVER_ID = 'driver-id-stub';

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindDriverNameByIdUseCase(
      mocks.driverRepository,
      mocks.userRepository,
    );
  });

  describe('happy path', () => {
    it('should return the driver name', async () => {
      // Arrange
      setupHappyPath(mocks, { id: DRIVER_ID }, 'João Silva');

      // Act
      const result = await sut.execute(DRIVER_ID);

      // Assert
      expect(result).toBe('João Silva');
      expect(mocks.driverRepository.findById).toHaveBeenCalledWith(DRIVER_ID);
    });
  });

  describe('error — driver not found', () => {
    it('should throw DriverNotFoundError when driver does not exist', async () => {
      // Arrange
      mocks.driverRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(DRIVER_ID)).rejects.toThrow(DriverNotFoundError);
      expect(mocks.userRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('error — user not found', () => {
    it('should throw DriverNotFoundError when associated user does not exist', async () => {
      // Arrange
      const driver = makeDriver({ id: DRIVER_ID });
      mocks.driverRepository.findById.mockResolvedValue(driver);
      mocks.userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(DRIVER_ID)).rejects.toThrow(DriverNotFoundError);
    });
  });
});
