import { TransitionTripInstanceStatusUseCase } from 'src/modules/trip/application/use-cases/transition-trip-instance-status.use-case';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
  InvalidTripStatusTransitionError,
  TripInstanceRequiredFieldError,
  TripNotAssignedToDriverError,
  DriverTripStatusTransitionForbiddenError,
} from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import { DriverStatus } from 'src/modules/driver/domain/interfaces/enums/driver-status.enum';
import { RoleName } from 'src/shared/domain/types';
import { makeTripInstance } from '../../factories/trip-instance.factory';
import { makeDriver } from '../../../driver/factories/driver.factory';
import { UnitOfWork } from 'src/shared/domain/interfaces/unit-of-work';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripInstanceRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  const driverRepository = {
    findByUserId: jest.fn(),
  } as any as jest.Mocked<DriverRepository>;

  const unitOfWork = {
    execute: jest.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
  } as any as jest.Mocked<UnitOfWork>;

  return { tripInstanceRepository, driverRepository, unitOfWork };
}

function setupHappyPath(
  mocks: ReturnType<typeof makeMocks>,
  instanceOverrides: Parameters<typeof makeTripInstance>[0] = {},
) {
  const instance = makeTripInstance({
    organizationId: ORG_ID,
    tripStatus: TripStatus.DRAFT,
    driverId: DRIVER_ID,
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
const DRIVER_ID = 'driver-id-stub';
const DRIVER_USER_ID = 'driver-user-id-stub';

describe('TransitionTripInstanceStatusUseCase', () => {
  let sut: TransitionTripInstanceStatusUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new TransitionTripInstanceStatusUseCase(
      mocks.tripInstanceRepository,
      mocks.driverRepository,
      mocks.unitOfWork,
    );
  });

  describe('happy path — DRAFT → SCHEDULED', () => {
    it('should transition DRAFT to SCHEDULED and return updated instance', async () => {
      setupHappyPath(mocks, { tripStatus: TripStatus.DRAFT });

      const result = await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.SCHEDULED },
        ORG_ID,
      );

      expect(result).toBeDefined();
      expect(result.tripStatus).toBe(TripStatus.SCHEDULED);
    });

    it('should call repository.update exactly once', async () => {
      setupHappyPath(mocks, { tripStatus: TripStatus.DRAFT });

      await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.SCHEDULED },
        ORG_ID,
      );

      expect(mocks.tripInstanceRepository.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('happy path — SCHEDULED → CONFIRMED', () => {
    it('should transition SCHEDULED to CONFIRMED', async () => {
      setupHappyPath(mocks, { tripStatus: TripStatus.SCHEDULED });

      const result = await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.CONFIRMED },
        ORG_ID,
      );

      expect(result.tripStatus).toBe(TripStatus.CONFIRMED);
    });
  });

  describe('happy path — CONFIRMED → IN_PROGRESS', () => {
    it('should transition CONFIRMED to IN_PROGRESS', async () => {
      setupHappyPath(mocks, { tripStatus: TripStatus.CONFIRMED });

      const result = await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.IN_PROGRESS },
        ORG_ID,
      );

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
      setupHappyPath(mocks, { tripStatus: fromStatus });

      const result = await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.CANCELED },
        ORG_ID,
      );

      expect(result.tripStatus).toBe(TripStatus.CANCELED);
    });
  });

  describe('error — instance not found', () => {
    it('should throw TripInstanceNotFoundError when instance does not exist', async () => {
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);
    });

    it('should NOT call update when instance is not found', async () => {
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);

      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — cross-org access', () => {
    it('should throw TripInstanceAccessForbiddenError when instance belongs to another org', async () => {
      const instance = makeTripInstance({
        organizationId: 'other-org',
        tripStatus: TripStatus.DRAFT,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceAccessForbiddenError);
    });

    it('should NOT call update when org is different', async () => {
      const instance = makeTripInstance({
        organizationId: 'other-org',
        tripStatus: TripStatus.DRAFT,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceAccessForbiddenError);

      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — invalid state machine transition', () => {
    it('should throw InvalidTripStatusTransitionError for DRAFT → IN_PROGRESS', async () => {
      setupHappyPath(mocks, { tripStatus: TripStatus.DRAFT });

      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.IN_PROGRESS }, ORG_ID),
      ).rejects.toThrow(InvalidTripStatusTransitionError);
    });

    it('should throw InvalidTripStatusTransitionError for FINISHED → any', async () => {
      setupHappyPath(mocks, { tripStatus: TripStatus.FINISHED });

      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.CANCELED }, ORG_ID),
      ).rejects.toThrow(InvalidTripStatusTransitionError);
    });

    it('should throw InvalidTripStatusTransitionError for CANCELED → any', async () => {
      setupHappyPath(mocks, { tripStatus: TripStatus.CANCELED });

      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.DRAFT }, ORG_ID),
      ).rejects.toThrow(InvalidTripStatusTransitionError);
    });

    it('should NOT call update when transition is invalid', async () => {
      setupHappyPath(mocks, { tripStatus: TripStatus.DRAFT });

      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.IN_PROGRESS }, ORG_ID),
      ).rejects.toThrow(InvalidTripStatusTransitionError);

      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — missing driver/vehicle for SCHEDULED', () => {
    it('should throw TripInstanceRequiredFieldError when driver is missing for DRAFT → SCHEDULED', async () => {
      setupHappyPath(mocks, {
        tripStatus: TripStatus.DRAFT,
        driverId: null,
        vehicleId: 'vehicle-uuid',
      });

      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceRequiredFieldError);
    });

    it('should throw TripInstanceRequiredFieldError when vehicle is missing for DRAFT → SCHEDULED', async () => {
      setupHappyPath(mocks, {
        tripStatus: TripStatus.DRAFT,
        driverId: 'driver-uuid',
        vehicleId: null,
      });

      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceRequiredFieldError);
    });

    it('should NOT call update when prerequisites are missing', async () => {
      setupHappyPath(mocks, {
        tripStatus: TripStatus.DRAFT,
        driverId: null,
        vehicleId: null,
      });

      await expect(
        sut.execute(INSTANCE_ID, { newStatus: TripStatus.SCHEDULED }, ORG_ID),
      ).rejects.toThrow(TripInstanceRequiredFieldError);

      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });
  });

  // ── Driver authorization ──────────────────────────────

  describe('driver authorization', () => {
    function driverCtx() {
      return { userId: DRIVER_USER_ID, role: RoleName.DRIVER };
    }

    it('allows the assigned ACTIVE driver to transition CONFIRMED → IN_PROGRESS', async () => {
      setupHappyPath(mocks, {
        tripStatus: TripStatus.CONFIRMED,
        driverId: DRIVER_ID,
      });
      mocks.driverRepository.findByUserId.mockResolvedValue(
        makeDriver({
          id: DRIVER_ID,
          userId: DRIVER_USER_ID,
          driverStatus: DriverStatus.ACTIVE,
        }),
      );

      const result = await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.IN_PROGRESS },
        ORG_ID,
        driverCtx(),
      );

      expect(result.tripStatus).toBe(TripStatus.IN_PROGRESS);
    });

    it('allows the assigned ACTIVE driver to transition IN_PROGRESS → FINISHED', async () => {
      setupHappyPath(mocks, {
        tripStatus: TripStatus.IN_PROGRESS,
        driverId: DRIVER_ID,
      });
      mocks.driverRepository.findByUserId.mockResolvedValue(
        makeDriver({
          id: DRIVER_ID,
          userId: DRIVER_USER_ID,
          driverStatus: DriverStatus.ACTIVE,
        }),
      );

      const result = await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.FINISHED },
        ORG_ID,
        driverCtx(),
      );

      expect(result.tripStatus).toBe(TripStatus.FINISHED);
    });

    it('rejects driver attempting CANCELED with DriverTripStatusTransitionForbiddenError', async () => {
      setupHappyPath(mocks, {
        tripStatus: TripStatus.SCHEDULED,
        driverId: DRIVER_ID,
      });

      await expect(
        sut.execute(
          INSTANCE_ID,
          { newStatus: TripStatus.CANCELED },
          ORG_ID,
          driverCtx(),
        ),
      ).rejects.toThrow(DriverTripStatusTransitionForbiddenError);
      expect(mocks.driverRepository.findByUserId).not.toHaveBeenCalled();
      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });

    it('rejects driver-not-owner with TripNotAssignedToDriverError', async () => {
      setupHappyPath(mocks, {
        tripStatus: TripStatus.CONFIRMED,
        driverId: 'someone-else',
      });
      mocks.driverRepository.findByUserId.mockResolvedValue(
        makeDriver({
          id: DRIVER_ID,
          userId: DRIVER_USER_ID,
          driverStatus: DriverStatus.ACTIVE,
        }),
      );

      await expect(
        sut.execute(
          INSTANCE_ID,
          { newStatus: TripStatus.IN_PROGRESS },
          ORG_ID,
          driverCtx(),
        ),
      ).rejects.toThrow(TripNotAssignedToDriverError);
      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });

    it('rejects SUSPENDED driver even when assigned, without leaking the reason', async () => {
      setupHappyPath(mocks, {
        tripStatus: TripStatus.CONFIRMED,
        driverId: DRIVER_ID,
      });
      mocks.driverRepository.findByUserId.mockResolvedValue(
        makeDriver({
          id: DRIVER_ID,
          userId: DRIVER_USER_ID,
          driverStatus: DriverStatus.SUSPENDED,
        }),
      );

      await expect(
        sut.execute(
          INSTANCE_ID,
          { newStatus: TripStatus.IN_PROGRESS },
          ORG_ID,
          driverCtx(),
        ),
      ).rejects.toThrow(TripNotAssignedToDriverError);
      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });

    it('rejects when driver has no profile at all', async () => {
      setupHappyPath(mocks, {
        tripStatus: TripStatus.CONFIRMED,
        driverId: DRIVER_ID,
      });
      mocks.driverRepository.findByUserId.mockResolvedValue(null);

      await expect(
        sut.execute(
          INSTANCE_ID,
          { newStatus: TripStatus.IN_PROGRESS },
          ORG_ID,
          driverCtx(),
        ),
      ).rejects.toThrow(TripNotAssignedToDriverError);
    });

    it('admin actor (or omitted context) skips driver checks', async () => {
      setupHappyPath(mocks, {
        tripStatus: TripStatus.IN_PROGRESS,
        driverId: 'someone-else',
      });

      const result = await sut.execute(
        INSTANCE_ID,
        { newStatus: TripStatus.FINISHED },
        ORG_ID,
        { userId: 'admin-user', role: RoleName.ADMIN },
      );

      expect(result.tripStatus).toBe(TripStatus.FINISHED);
      expect(mocks.driverRepository.findByUserId).not.toHaveBeenCalled();
    });
  });
});
