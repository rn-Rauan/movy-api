import { CreateVehicleUseCase } from 'src/modules/vehicle/application/use-cases/create-vehicle.use-case';
import { VehicleRepository } from 'src/modules/vehicle/domain/interfaces/vehicle.repository';
import {
  PlateAlreadyInUseError,
  VehicleCreationFailedError,
} from 'src/modules/vehicle/domain/entities/errors/vehicle.errors';
import { CreateVehicleDto } from 'src/modules/vehicle/application/dtos';
import { VehicleType } from 'src/modules/vehicle/domain/interfaces/enums/vehicle-type.enum';
import { makeVehicle } from '../../factories/vehicle.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const vehicleRepository = {
    findByPlate: jest.fn(),
    save: jest.fn(),
  } as any as jest.Mocked<VehicleRepository>;

  return { vehicleRepository };
}

function makeDto(overrides: Partial<CreateVehicleDto> = {}): CreateVehicleDto {
  return {
    plate: 'ABC1234',
    model: 'Mercedes-Benz Sprinter',
    type: VehicleType.VAN,
    maxCapacity: 15,
    ...overrides,
  };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  mocks.vehicleRepository.findByPlate.mockResolvedValue(null);
  mocks.vehicleRepository.save.mockImplementation(async (entity) => entity);
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';

describe('CreateVehicleUseCase', () => {
  let sut: CreateVehicleUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CreateVehicleUseCase(mocks.vehicleRepository);
  });

  describe('happy path', () => {
    it('should create and return a new vehicle', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(makeDto(), ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.organizationId).toBe(ORG_ID);
      expect(result.model).toBe('Mercedes-Benz Sprinter');
    });

    it('should call repository.save exactly once', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(makeDto(), ORG_ID);

      // Assert
      expect(mocks.vehicleRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('error — plate already in use', () => {
    it('should throw PlateAlreadyInUseError when plate is taken', async () => {
      // Arrange
      mocks.vehicleRepository.findByPlate.mockResolvedValue(makeVehicle());

      // Act & Assert
      await expect(sut.execute(makeDto(), ORG_ID)).rejects.toThrow(
        PlateAlreadyInUseError,
      );
      expect(mocks.vehicleRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error — persistence failure', () => {
    it('should throw VehicleCreationFailedError when save returns null', async () => {
      // Arrange
      mocks.vehicleRepository.findByPlate.mockResolvedValue(null);
      mocks.vehicleRepository.save.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(makeDto(), ORG_ID)).rejects.toThrow(
        VehicleCreationFailedError,
      );
    });
  });
});
