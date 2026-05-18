import {
  DriverAccessForbiddenError,
  DriverEntity,
  DriverNotFoundError,
} from 'src/modules/driver/domain/entities';
import { DriverRepository } from 'src/modules/driver/domain/interfaces';
import { UpdateTripTemplateUseCase } from 'src/modules/trip/application/use-cases/update-trip-template.use-case';
import {
  TripTemplateAccessForbiddenError,
  TripTemplateInactiveError,
  TripTemplateNotFoundError,
} from 'src/modules/trip/domain/entities/errors/trip-template.errors';
import { TripTemplateRepository } from 'src/modules/trip/domain/interfaces/trip-template.repository';
import {
  VehicleAccessForbiddenError,
  VehicleEntity,
  VehicleNotFoundError,
} from 'src/modules/vehicle/domain/entities';
import { VehicleRepository } from 'src/modules/vehicle/domain/interfaces';
import { makeTripTemplate } from '../../factories/trip-template.factory';
import { makeUpdateTripTemplateDto } from '../../factories/update-trip-template.dto.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripTemplateRepository = {
    findById: jest.fn(),
    update: jest.fn(),
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
  const tripTemplate = makeTripTemplate();

  mocks.tripTemplateRepository.findById.mockResolvedValue(tripTemplate);
  mocks.tripTemplateRepository.update.mockImplementation(
    async (entity) => entity,
  );

  return { tripTemplate };
}

// ── Tests ───────────────────────────────────────────────

describe('UpdateTripTemplateUseCase', () => {
  let sut: UpdateTripTemplateUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  const ORG_ID = 'org-id-stub';
  const TEMPLATE_ID = 'trip-template-id-stub';
  const DRIVER_ID = '6f9c2c2b-5a9b-4d7a-9c1e-1e2c8a3d4f5a';
  const VEHICLE_ID = '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d';

  beforeEach(() => {
    mocks = makeMocks();
    sut = new UpdateTripTemplateUseCase(
      mocks.tripTemplateRepository,
      mocks.driverRepository,
      mocks.vehicleRepository,
    );
  });

  describe('happy path — route update', () => {
    it('should find, update route, and return updated template', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeUpdateTripTemplateDto({
        departurePoint: 'Nova Origem',
        destination: 'Novo Destino',
      });

      // Act
      const result = await sut.execute(TEMPLATE_ID, dto, ORG_ID);

      // Assert
      expect(result.departurePoint).toBe('Nova Origem');
      expect(result.destination).toBe('Novo Destino');
      expect(mocks.tripTemplateRepository.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('happy path — pricing update', () => {
    it('should update pricing when price fields are provided', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeUpdateTripTemplateDto({ priceReturn: 15 });

      // Act
      const result = await sut.execute(TEMPLATE_ID, dto, ORG_ID);

      // Assert
      expect(result.priceReturn?.toNumber()).toBe(15);
      expect(result.priceOneWay?.toNumber()).toBe(12.5);
    });
  });

  describe('happy path — stops update', () => {
    it('should update stops when stops field is provided', async () => {
      // Arrange
      setupHappyPath(mocks);
      const newStops = ['Ponto A', 'Ponto B', 'Ponto C'];
      const dto = makeUpdateTripTemplateDto({ stops: newStops });

      // Act
      const result = await sut.execute(TEMPLATE_ID, dto, ORG_ID);

      // Assert
      expect(result.stops).toEqual(newStops);
    });
  });

  describe('happy path — auto-cancel config', () => {
    it('should enable auto-cancel with minRevenue and offset', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeUpdateTripTemplateDto({
        autoCancelEnabled: true,
        minRevenue: 100,
        autoCancelOffset: 30,
      });

      // Act
      const result = await sut.execute(TEMPLATE_ID, dto, ORG_ID);

      // Assert
      expect(result.autoCancelEnabled).toBe(true);
      expect(result.minRevenue?.toNumber()).toBe(100);
      expect(result.autoCancelOffset).toBe(30);
    });
  });

  describe('error — template not found', () => {
    it('should throw TripTemplateNotFoundError when template does not exist', async () => {
      // Arrange
      mocks.tripTemplateRepository.findById.mockResolvedValue(null);
      const dto = makeUpdateTripTemplateDto({ departurePoint: 'Anywhere' });

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, dto, ORG_ID)).rejects.toThrow(
        TripTemplateNotFoundError,
      );
      expect(mocks.tripTemplateRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — access forbidden', () => {
    it('should throw TripTemplateAccessForbiddenError when org does not match', async () => {
      // Arrange
      const tripTemplate = makeTripTemplate({ organizationId: 'other-org-id' });
      mocks.tripTemplateRepository.findById.mockResolvedValue(tripTemplate);
      const dto = makeUpdateTripTemplateDto({ departurePoint: 'Anywhere' });

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, dto, ORG_ID)).rejects.toThrow(
        TripTemplateAccessForbiddenError,
      );
      expect(mocks.tripTemplateRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — inactive template', () => {
    it('should throw TripTemplateInactiveError when template is inactive', async () => {
      // Arrange
      const tripTemplate = makeTripTemplate({ status: 'INACTIVE' });
      mocks.tripTemplateRepository.findById.mockResolvedValue(tripTemplate);
      const dto = makeUpdateTripTemplateDto({ departurePoint: 'Anywhere' });

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, dto, ORG_ID)).rejects.toThrow(
        TripTemplateInactiveError,
      );
      expect(mocks.tripTemplateRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — update persistence failure', () => {
    it('should throw TripTemplateNotFoundError when update returns null', async () => {
      // Arrange
      const tripTemplate = makeTripTemplate();
      mocks.tripTemplateRepository.findById.mockResolvedValue(tripTemplate);
      mocks.tripTemplateRepository.update.mockResolvedValue(null);
      const dto = makeUpdateTripTemplateDto({ departurePoint: 'Nova Origem' });

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, dto, ORG_ID)).rejects.toThrow(
        TripTemplateNotFoundError,
      );
    });
  });

  describe('defaultDriverId / defaultVehicleId', () => {
    it('should set both defaults when first provided and both belong to the org', async () => {
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

      const dto = makeUpdateTripTemplateDto({
        defaultDriverId: DRIVER_ID,
        defaultVehicleId: VEHICLE_ID,
      });

      // Act
      const result = await sut.execute(TEMPLATE_ID, dto, ORG_ID);

      // Assert
      expect(result.defaultDriverId).toBe(DRIVER_ID);
      expect(result.defaultVehicleId).toBe(VEHICLE_ID);
    });

    it('should clear defaultDriverId when null is passed and not call the driver repo', async () => {
      // Arrange
      const tripTemplate = makeTripTemplate({
        defaultDriverId: DRIVER_ID,
        defaultVehicleId: VEHICLE_ID,
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(tripTemplate);
      mocks.tripTemplateRepository.update.mockImplementation(
        async (entity) => entity,
      );

      const dto = makeUpdateTripTemplateDto({ defaultDriverId: null });

      // Act
      const result = await sut.execute(TEMPLATE_ID, dto, ORG_ID);

      // Assert
      expect(result.defaultDriverId).toBeNull();
      expect(result.defaultVehicleId).toBe(VEHICLE_ID);
      expect(mocks.driverRepository.findById).not.toHaveBeenCalled();
    });

    it('should preserve existing defaults when fields are not provided in DTO', async () => {
      // Arrange
      const tripTemplate = makeTripTemplate({
        defaultDriverId: DRIVER_ID,
        defaultVehicleId: VEHICLE_ID,
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(tripTemplate);
      mocks.tripTemplateRepository.update.mockImplementation(
        async (entity) => entity,
      );

      const dto = makeUpdateTripTemplateDto({ departurePoint: 'Nova Origem' });

      // Act
      const result = await sut.execute(TEMPLATE_ID, dto, ORG_ID);

      // Assert
      expect(result.defaultDriverId).toBe(DRIVER_ID);
      expect(result.defaultVehicleId).toBe(VEHICLE_ID);
      expect(mocks.driverRepository.findById).not.toHaveBeenCalled();
      expect(mocks.vehicleRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw DriverNotFoundError when defaultDriverId points to a missing driver', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.driverRepository.findById.mockResolvedValue(null);

      const dto = makeUpdateTripTemplateDto({ defaultDriverId: DRIVER_ID });

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, dto, ORG_ID)).rejects.toThrow(
        DriverNotFoundError,
      );
      expect(mocks.tripTemplateRepository.update).not.toHaveBeenCalled();
    });

    it('should throw DriverAccessForbiddenError when defaultDriverId belongs to another org', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.driverRepository.findById.mockResolvedValue({
        id: DRIVER_ID,
      } as unknown as DriverEntity);
      mocks.driverRepository.belongsToOrganization.mockResolvedValue(false);

      const dto = makeUpdateTripTemplateDto({ defaultDriverId: DRIVER_ID });

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, dto, ORG_ID)).rejects.toThrow(
        DriverAccessForbiddenError,
      );
      expect(mocks.tripTemplateRepository.update).not.toHaveBeenCalled();
    });

    it('should throw VehicleAccessForbiddenError when defaultVehicleId belongs to another org', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.vehicleRepository.findById.mockResolvedValue({
        id: VEHICLE_ID,
        organizationId: 'other-org-id',
      } as unknown as VehicleEntity);

      const dto = makeUpdateTripTemplateDto({ defaultVehicleId: VEHICLE_ID });

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, dto, ORG_ID)).rejects.toThrow(
        VehicleAccessForbiddenError,
      );
      expect(mocks.tripTemplateRepository.update).not.toHaveBeenCalled();
    });

    it('should throw VehicleNotFoundError when defaultVehicleId points to a missing vehicle', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.vehicleRepository.findById.mockResolvedValue(null);

      const dto = makeUpdateTripTemplateDto({ defaultVehicleId: VEHICLE_ID });

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, dto, ORG_ID)).rejects.toThrow(
        VehicleNotFoundError,
      );
      expect(mocks.tripTemplateRepository.update).not.toHaveBeenCalled();
    });
  });
});
