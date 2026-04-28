import { TransitionTripInstanceStatusUseCase } from 'src/modules/trip/application/use-cases/transition-trip-instance-status.use-case';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
  InvalidTripStatusTransitionError,
  TripInstanceRequiredFieldError,
} from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { makeTripInstance } from '../../factories/trip-instance.factory';
import { UnitOfWork } from 'src/shared/domain/interfaces/unit-of-work';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripInstanceRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  const unitOfWork = {
    execute: jest.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
  } as any as jest.Mocked<UnitOfWork>;

  return { tripInstanceRepository, unitOfWork };
}

function setupHappyPath(
  mocks: ReturnType<typeof makeMocks>,
  instanceOverrides: Parameters<typeof makeTripInstance>[0] = {},
) {
  const instance = makeTripInstance({
    organizationId: ORG_ID,
    tripStatus: TripStatus.DRAFT,
    driverId: 'driver-uuid',
    vehicleId: 'vehicle-uuid',
    ...instanceOverrides,
  });

  mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
  mocks.tripInstanceRepository.update.mockImplementation(
    async (entity) => entity,
  );

  return { instance };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const INSTANCE_ID = 'trip-instance-id-stub';

describe('TransitionTripInstanceStatusUseCase', () => {
  let sut: TransitionTripInstanceStatusUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new TransitionTripInstanceStatusUseCase(
      mocks.tripInstanceRepository,
      mocks.unitOfWork,
    );
  });

  describe('happy path — DRAFT → SCHEDULED', () => {
    it('should transition DRAFT to SCHEDULED and return updated instance', async () => {
      // Arrange
      setupHappyPath(mocks, { tripStatus: TripStatus.DRAFT });

      // Act
      const result = await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.SCHEDULED },
        ORG_ID,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.tripStatus).toBe(TripStatus.SCHEDULED);
    });

    it('should call repository.update exactly once', async () => {
      // Arrange
      setupHappyPath(mocks, { tripStatus: TripStatus.DRAFT });

      // Act
      await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.SCHEDULED },
        ORG_ID,
      );

      // Assert
      expect(mocks.tripInstanceRepository.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('happy path — SCHEDULED → CONFIRMED', () => {
    it('should transition SCHEDULED to CONFIRMED', async () => {
      // Arrange
      setupHappyPath(mocks, { tripStatus: TripStatus.SCHEDULED });

      // Act
      const result = await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.CONFIRMED },
        ORG_ID,
      );

      // Assert
      expect(result.tripStatus).toBe(TripStatus.CONFIRMED);
    });
  });

  describe('happy path — CONFIRMED → IN_PROGRESS', () => {
    it('should transition CONFIRMED to IN_PROGRESS', async () => {
      // Arrange
      setupHappyPath(mocks, { tripStatus: TripStatus.CONFIRMED });

      // Act
      const result = await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.IN_PROGRESS },
        ORG_ID,
      );

      // Assert
      expect(result.tripStatus).toBe(TripStatus.IN_PROGRESS);
    });
  });

  describe('happy path — any → CANCELED', () => {
    it.each([
      TripStatus.DRAFT,
      TripStatus.SCHEDULED,
      TripStatus.CONFIRMED,
      TripStatus.IN_PROGRESS,
    ])('should allow cancellation from %s', async (fromStatus) => {
      // Arrange
      setupHappyPath(mocks, { tripStatus: fromStatus });

      // Act
      const result = await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.CANCELED },
        ORG_ID,
      );

      // Assert
      expect(result.tripStatus).toBe(TripStatus.CANCELED);
    });
  });

  describe('error — instance not found', () => {
    it('should throw TripInstanceNotFoundError when instance does not exist', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);
    });

    it('should NOT call update when instance is not found', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act
      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);

      // Assert
      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — cross-org access', () => {
    it('should throw TripInstanceAccessForbiddenError when instance belongs to another org', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: 'other-org',
        tripStatus: TripStatus.DRAFT,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceAccessForbiddenError);
    });

    it('should NOT call update when org is different', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: 'other-org',
        tripStatus: TripStatus.DRAFT,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act
      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceAccessForbiddenError);

      // Assert
      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — invalid state machine transition', () => {
    it('should throw InvalidTripStatusTransitionError for DRAFT → IN_PROGRESS', async () => {
      // Arrange
      setupHappyPath(mocks, { tripStatus: TripStatus.DRAFT });

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.IN_PROGRESS }, ORG_ID),
      ).rejects.toThrow(InvalidTripStatusTransitionError);
    });

    it('should throw InvalidTripStatusTransitionError for FINISHED → any', async () => {
      // Arrange
      setupHappyPath(mocks, { tripStatus: TripStatus.FINISHED });

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.CANCELED }, ORG_ID),
      ).rejects.toThrow(InvalidTripStatusTransitionError);
    });

    it('should throw InvalidTripStatusTransitionError for CANCELED → any', async () => {
      // Arrange
      setupHappyPath(mocks, { tripStatus: TripStatus.CANCELED });

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.DRAFT }, ORG_ID),
      ).rejects.toThrow(InvalidTripStatusTransitionError);
    });

    it('should NOT call update when transition is invalid', async () => {
      // Arrange
      setupHappyPath(mocks, { tripStatus: TripStatus.DRAFT });

      // Act
      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.IN_PROGRESS }, ORG_ID),
      ).rejects.toThrow(InvalidTripStatusTransitionError);

      // Assert
      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — missing driver/vehicle for SCHEDULED', () => {
    it('should throw TripInstanceRequiredFieldError when driver is missing for DRAFT → SCHEDULED', async () => {
      // Arrange
      setupHappyPath(mocks, {
        tripStatus: TripStatus.DRAFT,
        driverId: null,
        vehicleId: 'vehicle-uuid',
      });

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceRequiredFieldError);
    });

    it('should throw TripInstanceRequiredFieldError when vehicle is missing for DRAFT → SCHEDULED', async () => {
      // Arrange
      setupHappyPath(mocks, {
        tripStatus: TripStatus.DRAFT,
        driverId: 'driver-uuid',
        vehicleId: null,
      });

      // Act & Assert
      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceRequiredFieldError);
    });

    it('should NOT call update when prerequisites are missing', async () => {
      // Arrange
      setupHappyPath(mocks, {
        tripStatus: TripStatus.DRAFT,
        driverId: null,
        vehicleId: null,
      });

      // Act
      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceRequiredFieldError);

      // Assert
      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });
  });
});
