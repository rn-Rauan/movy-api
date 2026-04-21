import { AssignDriverToTripInstanceUseCase } from 'src/modules/trip/application/use-cases/assign-driver-to-trip-instance.use-case';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { DriverNotFoundError } from 'src/modules/driver/domain/entities/errors/driver.errors';
import { makeTripInstance } from '../../factories/trip-instance.factory';
import { makeDriver } from '../../../driver/factories/driver.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripInstanceRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  const driverRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<DriverRepository>;

  return { tripInstanceRepository, driverRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const instance = makeTripInstance({ organizationId: ORG_ID });
  const driver = makeDriver({ id: DRIVER_ID });
  const updated = makeTripInstance({ organizationId: ORG_ID, driverId: DRIVER_ID });

  mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
  mocks.driverRepository.findById.mockResolvedValue(driver);
  mocks.tripInstanceRepository.update.mockImplementation(async (entity) => entity);

  return { instance, driver, updated };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const INSTANCE_ID = 'trip-instance-id-stub';
const DRIVER_ID = 'driver-id-stub';

describe('AssignDriverToTripInstanceUseCase', () => {
  let sut: AssignDriverToTripInstanceUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new AssignDriverToTripInstanceUseCase(
      mocks.tripInstanceRepository,
      mocks.driverRepository,
    );
  });

  describe('happy path — assign driver', () => {
    it('should assign a driver and return the updated instance', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(INSTANCE_ID, DRIVER_ID, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.driverId).toBe(DRIVER_ID);
    });

    it('should call repository.update exactly once with the mutated instance', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(INSTANCE_ID, DRIVER_ID, ORG_ID);

      // Assert
      expect(mocks.tripInstanceRepository.update).toHaveBeenCalledTimes(1);
      expect(mocks.tripInstanceRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ driverId: DRIVER_ID }),
      );
    });

    it('should call driverRepository.findById with the provided driverId', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(INSTANCE_ID, DRIVER_ID, ORG_ID);

      // Assert
      expect(mocks.driverRepository.findById).toHaveBeenCalledWith(DRIVER_ID);
      expect(mocks.driverRepository.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('happy path — unassign driver (null)', () => {
    it('should unassign driver when driverId is null and skip driver validation', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: ORG_ID,
        driverId: DRIVER_ID,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
      mocks.tripInstanceRepository.update.mockImplementation(async (entity) => entity);

      // Act
      const result = await sut.execute(INSTANCE_ID, null, ORG_ID);

      // Assert
      expect(result.driverId).toBeNull();
      expect(mocks.driverRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('error — instance not found', () => {
    it('should throw TripInstanceNotFoundError when instance does not exist', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, DRIVER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);
    });

    it('should NOT call driverRepository when instance is not found', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, DRIVER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);

      expect(mocks.driverRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('error — forbidden access', () => {
    it('should throw TripInstanceAccessForbiddenError when org does not match', async () => {
      // Arrange
      const instance = makeTripInstance({ organizationId: 'other-org-id' });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, DRIVER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceAccessForbiddenError);
    });

    it('should NOT validate driver when org check fails', async () => {
      // Arrange
      const instance = makeTripInstance({ organizationId: 'other-org-id' });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, DRIVER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceAccessForbiddenError);

      expect(mocks.driverRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('error — driver not found', () => {
    it('should throw DriverNotFoundError when driver does not exist', async () => {
      // Arrange
      const instance = makeTripInstance({ organizationId: ORG_ID });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
      mocks.driverRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, DRIVER_ID, ORG_ID),
      ).rejects.toThrow(DriverNotFoundError);
    });

    it('should NOT call repository.update when driver is not found', async () => {
      // Arrange
      const instance = makeTripInstance({ organizationId: ORG_ID });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
      mocks.driverRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, DRIVER_ID, ORG_ID),
      ).rejects.toThrow(DriverNotFoundError);

      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — update returns null', () => {
    it('should throw TripInstanceNotFoundError when update returns null', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.tripInstanceRepository.update.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, DRIVER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);
    });
  });
});
