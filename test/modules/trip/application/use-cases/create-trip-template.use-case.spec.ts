import {
  DriverAccessForbiddenError,
  DriverEntity,
  DriverNotFoundError,
} from 'src/modules/driver/domain/entities';
import { DriverRepository } from 'src/modules/driver/domain/interfaces';
import { CreateTripTemplateUseCase } from 'src/modules/trip/application/use-cases/create-trip-template.use-case';
import {
  InvalidTripPriceConfigurationError,
  InvalidTripTimeOfDayFormatError,
  InvalidTripTimeOfDayOrderError,
  TripTemplateCreationFailedError,
} from 'src/modules/trip/domain/entities/errors/trip-template.errors';
import { TripTemplateRepository } from 'src/modules/trip/domain/interfaces/trip-template.repository';
import {
  VehicleAccessForbiddenError,
  VehicleEntity,
  VehicleNotFoundError,
} from 'src/modules/vehicle/domain/entities';
import { VehicleRepository } from 'src/modules/vehicle/domain/interfaces';
import { makeCreateTripTemplateDto } from '../../factories/create-trip-template.dto.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripTemplateRepository = {
    save: jest.fn(),
  } as any as jest.Mocked<TripTemplateRepository>;

  const driverRepository = {
    findById: jest.fn(),
    belongsToOrganization: jest.fn(),
  } as any as jest.Mocked<DriverRepository>;

  const vehicleRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<VehicleRepository>;

  return { tripTemplateRepository, driverRepository, vehicleRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  mocks.tripTemplateRepository.save.mockImplementation(
    async (entity) => entity,
  );
}

// ── Tests ───────────────────────────────────────────────

describe('CreateTripTemplateUseCase', () => {
  let sut: CreateTripTemplateUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  const ORG_ID = 'org-id-stub';
  const DRIVER_ID = '6f9c2c2b-5a9b-4d7a-9c1e-1e2c8a3d4f5a';
  const VEHICLE_ID = '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d';

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CreateTripTemplateUseCase(
      mocks.tripTemplateRepository,
      mocks.driverRepository,
      mocks.vehicleRepository,
    );
  });

  describe('happy path', () => {
    it('should create and return a new trip template', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripTemplateDto();

      // Act
      const result = await sut.execute(dto, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.organizationId).toBe(ORG_ID);
      expect(result.departurePoint).toBe(dto.departurePoint);
      expect(result.destination).toBe(dto.destination);
      expect(result.priceOneWay?.toNumber()).toBe(dto.priceOneWay);
    });

    it('should call repository.save exactly once', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripTemplateDto();

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      expect(mocks.tripTemplateRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should persist entity with correct organizationId and shift', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripTemplateDto();

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      const savedEntity = mocks.tripTemplateRepository.save.mock.calls[0][0];
      expect(savedEntity.organizationId).toBe(ORG_ID);
      expect(savedEntity.shift).toBe(dto.shift);
      expect(savedEntity.status).toBe('ACTIVE');
    });
  });

  describe('error — persistence failure', () => {
    it('should throw TripTemplateCreationFailedError when save returns null', async () => {
      // Arrange
      mocks.tripTemplateRepository.save.mockResolvedValue(null);
      const dto = makeCreateTripTemplateDto();

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        TripTemplateCreationFailedError,
      );
    });
  });

  describe('error — domain validation', () => {
    it('should propagate InvalidTripPriceConfigurationError when no price is provided', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripTemplateDto({ priceOneWay: undefined });

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        InvalidTripPriceConfigurationError,
      );
      expect(mocks.tripTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should throw InvalidTripTimeOfDayFormatError when departureTimeOfDay is malformed', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripTemplateDto({ departureTimeOfDay: '7:30' });

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        InvalidTripTimeOfDayFormatError,
      );
      expect(mocks.tripTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should throw InvalidTripTimeOfDayOrderError when arrival equals departure', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripTemplateDto({
        departureTimeOfDay: '07:30',
        arrivalTimeOfDay: '07:30',
      });

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        InvalidTripTimeOfDayOrderError,
      );
      expect(mocks.tripTemplateRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('defaultDriverId / defaultVehicleId', () => {
    it('should persist defaults when both belong to the org', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.driverRepository.findById.mockResolvedValue({
        id: DRIVER_ID,
      } as unknown as DriverEntity);
      mocks.driverRepository.belongsToOrganization.mockResolvedValue(true);
      mocks.vehicleRepository.findById.mockResolvedValue({
        id: VEHICLE_ID,
        organizationId: ORG_ID,
      } as unknown as VehicleEntity);

      const dto = makeCreateTripTemplateDto({
        defaultDriverId: DRIVER_ID,
        defaultVehicleId: VEHICLE_ID,
      });

      // Act
      const result = await sut.execute(dto, ORG_ID);

      // Assert
      expect(result.defaultDriverId).toBe(DRIVER_ID);
      expect(result.defaultVehicleId).toBe(VEHICLE_ID);
      expect(mocks.driverRepository.belongsToOrganization).toHaveBeenCalledWith(
        DRIVER_ID,
        ORG_ID,
      );
    });

    it('should throw DriverNotFoundError when defaultDriverId does not exist', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.driverRepository.findById.mockResolvedValue(null);

      const dto = makeCreateTripTemplateDto({ defaultDriverId: DRIVER_ID });

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        DriverNotFoundError,
      );
      expect(mocks.tripTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should throw DriverAccessForbiddenError when defaultDriverId belongs to another org', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.driverRepository.findById.mockResolvedValue({
        id: DRIVER_ID,
      } as unknown as DriverEntity);
      mocks.driverRepository.belongsToOrganization.mockResolvedValue(false);

      const dto = makeCreateTripTemplateDto({ defaultDriverId: DRIVER_ID });

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        DriverAccessForbiddenError,
      );
      expect(mocks.tripTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should throw VehicleNotFoundError when defaultVehicleId does not exist', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.vehicleRepository.findById.mockResolvedValue(null);

      const dto = makeCreateTripTemplateDto({ defaultVehicleId: VEHICLE_ID });

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        VehicleNotFoundError,
      );
      expect(mocks.tripTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should throw VehicleAccessForbiddenError when defaultVehicleId belongs to another org', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.vehicleRepository.findById.mockResolvedValue({
        id: VEHICLE_ID,
        organizationId: 'other-org-id',
      } as unknown as VehicleEntity);

      const dto = makeCreateTripTemplateDto({ defaultVehicleId: VEHICLE_ID });

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        VehicleAccessForbiddenError,
      );
      expect(mocks.tripTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should not call driver/vehicle repos when defaults are omitted', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripTemplateDto();

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      expect(mocks.driverRepository.findById).not.toHaveBeenCalled();
      expect(mocks.vehicleRepository.findById).not.toHaveBeenCalled();
    });
  });
});
