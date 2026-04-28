import { CreateTripInstanceUseCase } from 'src/modules/trip/application/use-cases/create-trip-instance.use-case';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { TripTemplateRepository } from 'src/modules/trip/domain/interfaces/trip-template.repository';
import { TripInstanceCreationFailedError } from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import {
  TripTemplateAccessForbiddenError,
  TripTemplateInactiveError,
  TripTemplateNotFoundError,
} from 'src/modules/trip/domain/entities/errors/trip-template.errors';
import { makeTripInstance } from '../../factories/trip-instance.factory';
import { makeTripTemplate } from '../../factories/trip-template.factory';
import { makeCreateTripInstanceDto } from '../../factories/create-trip-instance.dto.factory';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import { UnitOfWork } from 'src/shared/domain/interfaces/unit-of-work';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripInstanceRepository = {
    save: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  const tripTemplateRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<TripTemplateRepository>;

  const unitOfWork = {
    execute: jest.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
  } as any as jest.Mocked<UnitOfWork>;

  return { tripInstanceRepository, tripTemplateRepository, unitOfWork };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const template = makeTripTemplate({ organizationId: ORG_ID });
  const instance = makeTripInstance({
    organizationId: ORG_ID,
    tripStatus: TripStatus.DRAFT,
  });

  mocks.tripTemplateRepository.findById.mockResolvedValue(template);
  mocks.tripInstanceRepository.save.mockImplementation(
    async (entity) => entity,
  );

  return { template, instance };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';

describe('CreateTripInstanceUseCase', () => {
  let sut: CreateTripInstanceUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CreateTripInstanceUseCase(
      mocks.tripInstanceRepository,
      mocks.tripTemplateRepository,
      mocks.unitOfWork,
    );
  });

  describe('happy path — without auto-cancel', () => {
    it('should create and persist a DRAFT trip instance', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripInstanceDto();

      // Act
      const result = await sut.execute(dto, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.tripStatus).toBe(TripStatus.DRAFT);
      expect(result.organizationId).toBe(ORG_ID);
    });

    it('should call repository.save exactly once', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripInstanceDto();

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      expect(mocks.tripInstanceRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should persist instance with correct tripTemplateId and capacity', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripInstanceDto({ totalCapacity: 30 });

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      const saved = mocks.tripInstanceRepository.save.mock.calls[0][0];
      expect(saved.tripTemplateId).toBe(dto.tripTemplateId);
      expect(saved.totalCapacity).toBe(30);
    });

    it('should persist instance without driverId and vehicleId when not provided', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripInstanceDto();

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      const saved = mocks.tripInstanceRepository.save.mock.calls[0][0];
      expect(saved.driverId).toBeNull();
      expect(saved.vehicleId).toBeNull();
    });

    it('should persist instance with driverId and vehicleId when provided', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripInstanceDto({
        driverId: 'driver-uuid',
        vehicleId: 'vehicle-uuid',
      });

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      const saved = mocks.tripInstanceRepository.save.mock.calls[0][0];
      expect(saved.driverId).toBe('driver-uuid');
      expect(saved.vehicleId).toBe('vehicle-uuid');
    });
  });

  describe('happy path — with auto-cancel from template', () => {
    it('should inherit autoCancelAt calculated from template offset', async () => {
      // Arrange
      const template = makeTripTemplate({
        organizationId: ORG_ID,
        autoCancelEnabled: true,
        minRevenue: 200,
        autoCancelOffset: 60, // 60 min before departure
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);
      mocks.tripInstanceRepository.save.mockImplementation(async (e) => e);

      const departure = new Date(Date.now() + 86400000);
      const arrival = new Date(departure.getTime() + 3600000);
      const dto = makeCreateTripInstanceDto({
        departureTime: departure.toISOString(),
        arrivalEstimate: arrival.toISOString(),
      });

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      const saved = mocks.tripInstanceRepository.save.mock.calls[0][0];
      expect(saved.autoCancelAt).toBeDefined();
      const expectedAutoCancelAt = new Date(
        departure.getTime() - 60 * 60 * 1000,
      );
      expect(saved.autoCancelAt?.getTime()).toBeCloseTo(
        expectedAutoCancelAt.getTime(),
        -3,
      );
    });

    it('should inherit minRevenue from template when autoCancelEnabled and no dto override', async () => {
      // Arrange
      const template = makeTripTemplate({
        organizationId: ORG_ID,
        autoCancelEnabled: true,
        minRevenue: 300,
        autoCancelOffset: 60,
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);
      mocks.tripInstanceRepository.save.mockImplementation(async (e) => e);

      const departure = new Date(Date.now() + 86400000);
      const arrival = new Date(departure.getTime() + 3600000);
      const dto = makeCreateTripInstanceDto({
        departureTime: departure.toISOString(),
        arrivalEstimate: arrival.toISOString(),
        minRevenue: null,
      });

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      const saved = mocks.tripInstanceRepository.save.mock.calls[0][0];
      expect(saved.minRevenue?.toNumber()).toBe(300);
    });

    it('should use dto minRevenue override instead of template value', async () => {
      // Arrange
      const template = makeTripTemplate({
        organizationId: ORG_ID,
        autoCancelEnabled: true,
        minRevenue: 300,
        autoCancelOffset: 60,
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);
      mocks.tripInstanceRepository.save.mockImplementation(async (e) => e);

      const departure = new Date(Date.now() + 86400000);
      const arrival = new Date(departure.getTime() + 3600000);
      const dto = makeCreateTripInstanceDto({
        departureTime: departure.toISOString(),
        arrivalEstimate: arrival.toISOString(),
        minRevenue: 150,
      });

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      const saved = mocks.tripInstanceRepository.save.mock.calls[0][0];
      expect(saved.minRevenue?.toNumber()).toBe(150);
    });
  });

  describe('error — template not found', () => {
    it('should throw TripTemplateNotFoundError when template does not exist', async () => {
      // Arrange
      mocks.tripTemplateRepository.findById.mockResolvedValue(null);
      const dto = makeCreateTripInstanceDto();

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        TripTemplateNotFoundError,
      );
    });

    it('should NOT call repository.save when template is not found', async () => {
      // Arrange
      mocks.tripTemplateRepository.findById.mockResolvedValue(null);
      const dto = makeCreateTripInstanceDto();

      // Act
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        TripTemplateNotFoundError,
      );

      // Assert
      expect(mocks.tripInstanceRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error — template belongs to another org', () => {
    it('should throw TripTemplateAccessForbiddenError when template org differs', async () => {
      // Arrange
      const template = makeTripTemplate({ organizationId: 'other-org' });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);
      const dto = makeCreateTripInstanceDto();

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        TripTemplateAccessForbiddenError,
      );
    });

    it('should NOT call repository.save when template belongs to another org', async () => {
      // Arrange
      const template = makeTripTemplate({ organizationId: 'other-org' });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);
      const dto = makeCreateTripInstanceDto();

      // Act
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        TripTemplateAccessForbiddenError,
      );

      // Assert
      expect(mocks.tripInstanceRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error — template inactive', () => {
    it('should throw TripTemplateInactiveError when template is inactive', async () => {
      // Arrange
      const template = makeTripTemplate({
        organizationId: ORG_ID,
        status: 'INACTIVE',
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);
      const dto = makeCreateTripInstanceDto();

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        TripTemplateInactiveError,
      );
    });

    it('should NOT call repository.save when template is inactive', async () => {
      // Arrange
      const template = makeTripTemplate({
        organizationId: ORG_ID,
        status: 'INACTIVE',
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);
      const dto = makeCreateTripInstanceDto();

      // Act
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        TripTemplateInactiveError,
      );

      // Assert
      expect(mocks.tripInstanceRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error — persistence failure', () => {
    it('should throw TripInstanceCreationFailedError when save returns null', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.tripInstanceRepository.save.mockResolvedValue(null);
      const dto = makeCreateTripInstanceDto();

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        TripInstanceCreationFailedError,
      );
    });
  });
});
