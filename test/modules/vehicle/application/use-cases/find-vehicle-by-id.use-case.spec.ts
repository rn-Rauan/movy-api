import { FindVehicleByIdUseCase } from 'src/modules/vehicle/application/use-cases/find-vehicle-by-id.use-case';
import { VehicleRepository } from 'src/modules/vehicle/domain/interfaces/vehicle.repository';
import {
  VehicleNotFoundError,
  VehicleAccessForbiddenError,
} from 'src/modules/vehicle/domain/entities/errors/vehicle.errors';
import { makeVehicle } from '../../factories/vehicle.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const vehicleRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<VehicleRepository>;

  return { vehicleRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const vehicle = makeVehicle({ organizationId: ORG_ID });
  mocks.vehicleRepository.findById.mockResolvedValue(vehicle);
  return { vehicle };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const VEHICLE_ID = 'vehicle-id-stub';

describe('FindVehicleByIdUseCase', () => {
  let sut: FindVehicleByIdUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindVehicleByIdUseCase(mocks.vehicleRepository);
  });

  describe('happy path', () => {
    it('should find and return the vehicle', async () => {
      // Arrange
      const { vehicle } = setupHappyPath(mocks);

      // Act
      const result = await sut.execute(VEHICLE_ID, ORG_ID);

      // Assert
      expect(result).toBe(vehicle);
    });
  });

  describe('error — not found', () => {
    it('should throw VehicleNotFoundError when vehicle does not exist', async () => {
      // Arrange
      mocks.vehicleRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(VEHICLE_ID, ORG_ID)).rejects.toThrow(
        VehicleNotFoundError,
      );
    });
  });

  describe('error — access forbidden', () => {
    it('should throw VehicleAccessForbiddenError when vehicle belongs to a different org', async () => {
      // Arrange
      const vehicle = makeVehicle({ organizationId: 'other-org-id' });
      mocks.vehicleRepository.findById.mockResolvedValue(vehicle);

      // Act & Assert
      await expect(sut.execute(VEHICLE_ID, ORG_ID)).rejects.toThrow(
        VehicleAccessForbiddenError,
      );
    });
  });
});
