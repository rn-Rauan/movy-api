import { CreateDriverUseCase } from 'src/modules/driver/application/use-cases/create-driver.use-case';
import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import {
  DriverAlreadyExistsError,
  DriverCreationFailedError,
} from 'src/modules/driver/domain/entities/errors/driver.errors';
import { makeDriver } from '../../factories/driver.factory';
import { makeCreateDriverDto } from '../../factories/create-driver.dto.factory';

// ── Mock helpers ────────────────────────────────────────────

function makeMocks() {
  const driverRepository = {
    findByUserId: jest.fn(),
    save: jest.fn(),
  } as any as jest.Mocked<DriverRepository>;

  return { driverRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  mocks.driverRepository.findByUserId.mockResolvedValue(null);
  mocks.driverRepository.save.mockImplementation(async (driver) => driver);
}

// ── Tests ───────────────────────────────────────────────────

describe('CreateDriverUseCase', () => {
  let sut: CreateDriverUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  const USER_ID = 'user-id-stub';

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CreateDriverUseCase(mocks.driverRepository);
  });

  describe('happy path', () => {
    it('should create and return a new driver entity', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateDriverDto();

      // Act
      const result = await sut.execute(USER_ID, dto);

      // Assert
      expect(result.userId).toBe(USER_ID);
      expect(result.cnh.value_).toBe(dto.cnh);
      expect(result.cnhCategory.value_).toBe(dto.cnhCategory);
      expect(mocks.driverRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should check for existing driver before saving', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateDriverDto();

      // Act
      await sut.execute(USER_ID, dto);

      // Assert
      expect(mocks.driverRepository.findByUserId).toHaveBeenCalledWith(USER_ID);
      expect(mocks.driverRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('error — driver already exists', () => {
    it('should throw DriverAlreadyExistsError when user already has a driver profile', async () => {
      // Arrange
      const existingDriver = makeDriver({ userId: USER_ID });
      mocks.driverRepository.findByUserId.mockResolvedValue(existingDriver);
      const dto = makeCreateDriverDto();

      // Act & Assert
      await expect(sut.execute(USER_ID, dto)).rejects.toThrow(
        DriverAlreadyExistsError,
      );
      expect(mocks.driverRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error — persistence failure', () => {
    it('should throw DriverCreationFailedError when save returns null', async () => {
      // Arrange
      mocks.driverRepository.findByUserId.mockResolvedValue(null);
      mocks.driverRepository.save.mockResolvedValue(null);
      const dto = makeCreateDriverDto();

      // Act & Assert
      await expect(sut.execute(USER_ID, dto)).rejects.toThrow(
        DriverCreationFailedError,
      );
    });
  });
});
