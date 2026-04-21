import { AssignVehicleToTripInstanceUseCase } from 'src/modules/trip/application/use-cases/assign-vehicle-to-trip-instance.use-case';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { VehicleRepository } from 'src/modules/vehicle/domain/interfaces/vehicle.repository';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { VehicleNotFoundError } from 'src/modules/vehicle/domain/entities/errors/vehicle.errors';
import { makeTripInstance } from '../../factories/trip-instance.factory';
import { makeVehicle } from '../../../vehicle/factories/vehicle.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripInstanceRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  const vehicleRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<VehicleRepository>;

  return { tripInstanceRepository, vehicleRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const instance = makeTripInstance({ organizationId: ORG_ID });
  const vehicle = makeVehicle({ id: VEHICLE_ID });

  mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
  mocks.vehicleRepository.findById.mockResolvedValue(vehicle);
  mocks.tripInstanceRepository.update.mockImplementation(async (entity) => entity);

  return { instance, vehicle };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const INSTANCE_ID = 'trip-instance-id-stub';
const VEHICLE_ID = 'vehicle-id-stub';

describe('AssignVehicleToTripInstanceUseCase', () => {
  let sut: AssignVehicleToTripInstanceUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new AssignVehicleToTripInstanceUseCase(
      mocks.tripInstanceRepository,
      mocks.vehicleRepository,
    );
  });

  describe('happy path — assign vehicle', () => {
    it('should assign a vehicle and return the updated instance', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(INSTANCE_ID, VEHICLE_ID, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.vehicleId).toBe(VEHICLE_ID);
    });

    it('should call repository.update exactly once with the mutated instance', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(INSTANCE_ID, VEHICLE_ID, ORG_ID);

      // Assert
      expect(mocks.tripInstanceRepository.update).toHaveBeenCalledTimes(1);
      expect(mocks.tripInstanceRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ vehicleId: VEHICLE_ID }),
      );
    });

    it('should call vehicleRepository.findById with the provided vehicleId', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(INSTANCE_ID, VEHICLE_ID, ORG_ID);

      // Assert
      expect(mocks.vehicleRepository.findById).toHaveBeenCalledWith(VEHICLE_ID);
      expect(mocks.vehicleRepository.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('happy path — unassign vehicle (null)', () => {
    it('should unassign vehicle when vehicleId is null and skip vehicle validation', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: ORG_ID,
        vehicleId: VEHICLE_ID,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
      mocks.tripInstanceRepository.update.mockImplementation(async (entity) => entity);

      // Act
      const result = await sut.execute(INSTANCE_ID, null, ORG_ID);

      // Assert
      expect(result.vehicleId).toBeNull();
      expect(mocks.vehicleRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('error — instance not found', () => {
    it('should throw TripInstanceNotFoundError when instance does not exist', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, VEHICLE_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);
    });

    it('should NOT call vehicleRepository when instance is not found', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, VEHICLE_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);

      expect(mocks.vehicleRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('error — forbidden access', () => {
    it('should throw TripInstanceAccessForbiddenError when org does not match', async () => {
      // Arrange
      const instance = makeTripInstance({ organizationId: 'other-org-id' });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, VEHICLE_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceAccessForbiddenError);
    });

    it('should NOT validate vehicle when org check fails', async () => {
      // Arrange
      const instance = makeTripInstance({ organizationId: 'other-org-id' });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, VEHICLE_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceAccessForbiddenError);

      expect(mocks.vehicleRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('error — vehicle not found', () => {
    it('should throw VehicleNotFoundError when vehicle does not exist', async () => {
      // Arrange
      const instance = makeTripInstance({ organizationId: ORG_ID });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
      mocks.vehicleRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, VEHICLE_ID, ORG_ID),
      ).rejects.toThrow(VehicleNotFoundError);
    });

    it('should NOT call repository.update when vehicle is not found', async () => {
      // Arrange
      const instance = makeTripInstance({ organizationId: ORG_ID });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
      mocks.vehicleRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, VEHICLE_ID, ORG_ID),
      ).rejects.toThrow(VehicleNotFoundError);

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
        sut.execute(INSTANCE_ID, VEHICLE_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);
    });
  });
});
