import { GenerateRecurringTripInstancesUseCase } from 'src/modules/trip/application/use-cases/generate-recurring-trip-instances.use-case';
import { OrganizationRepository } from 'src/modules/organization/domain/interfaces/organization.repository';
import { TripSchedulingConfigRepository } from 'src/modules/scheduling/domain/interfaces';
import { PlanLimitService } from 'src/modules/subscriptions/application/services/plan-limit.service';
import {
  MonthlyTripLimitExceededError,
  NoActiveSubscriptionError,
} from 'src/modules/subscriptions/domain/errors/subscription.errors';
import {
  DayOfWeek,
  TripInstanceRepository,
  TripStatus,
  TripTemplateRepository,
} from 'src/modules/trip/domain/interfaces';
import { makeOrganization } from '../../../organization/factories/organization.factory';
import { makeTripSchedulingConfig } from '../../../scheduling/factories/trip-scheduling-config.factory';
import { makeTripTemplate } from '../../factories/trip-template.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const organizationRepository = {
    findAllActiveUnpaginated: jest.fn(),
  } as any as jest.Mocked<OrganizationRepository>;

  const tripTemplateRepository = {
    findActiveRecurringByOrganizationId: jest.fn(),
  } as any as jest.Mocked<TripTemplateRepository>;

  const tripInstanceRepository = {
    existsForTemplateOnDay: jest.fn(),
    countByOrganizationAndMonth: jest.fn(),
    save: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  const schedulingConfigRepository = {
    findByOrganizationId: jest.fn(),
  } as any as jest.Mocked<TripSchedulingConfigRepository>;

  const planLimitService = {
    assertMonthlyTripLimit: jest.fn(),
  } as any as jest.Mocked<PlanLimitService>;

  return {
    organizationRepository,
    tripTemplateRepository,
    tripInstanceRepository,
    schedulingConfigRepository,
    planLimitService,
  };
}

const ALL_DAYS: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

// Pin "now" to a Sunday 02:00 UTC so date arithmetic is deterministic across
// timezones / clocks. Templates default to departureTimeOfDay '07:30', which
// is 5.5h ahead of the pinned now → today's generation isn't filtered as past.
const PINNED_NOW = new Date(Date.UTC(2026, 4, 17, 2, 0, 0)); // 2026-05-17T02:00:00Z, Sunday

// ── Tests ───────────────────────────────────────────────

describe('GenerateRecurringTripInstancesUseCase', () => {
  let sut: GenerateRecurringTripInstancesUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(PINNED_NOW);
    mocks = makeMocks();
    sut = new GenerateRecurringTripInstancesUseCase(
      mocks.organizationRepository,
      mocks.tripTemplateRepository,
      mocks.tripInstanceRepository,
      mocks.schedulingConfigRepository,
      mocks.planLimitService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('happy path — nothing to do', () => {
    it('should return zero counters when no active organisations exist', async () => {
      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue(
        [],
      );

      const result = await sut.execute();

      expect(result).toEqual({ created: 0, skipped: 0, failed: 0 });
      expect(
        mocks.tripTemplateRepository.findActiveRecurringByOrganizationId,
      ).not.toHaveBeenCalled();
    });

    it('should skip orgs whose scheduling config is disabled', async () => {
      const org = makeOrganization({ id: 'org-1' });
      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        makeTripSchedulingConfig({ organizationId: org.id, enabled: false }),
      );

      const result = await sut.execute();

      expect(result).toEqual({ created: 0, skipped: 0, failed: 0 });
      expect(
        mocks.tripTemplateRepository.findActiveRecurringByOrganizationId,
      ).not.toHaveBeenCalled();
    });

    it('should iterate orgs but skip those with no recurring templates', async () => {
      const org = makeOrganization({ id: 'org-1' });
      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        null,
      );
      mocks.tripTemplateRepository.findActiveRecurringByOrganizationId.mockResolvedValue(
        [],
      );

      const result = await sut.execute();

      expect(result).toEqual({ created: 0, skipped: 0, failed: 0 });
      expect(
        mocks.tripInstanceRepository.countByOrganizationAndMonth,
      ).not.toHaveBeenCalled();
    });
  });

  describe('happy path — generation', () => {
    it('should create instances for every frequency-matching day in the window', async () => {
      const org = makeOrganization({ id: 'org-1' });
      const template = makeTripTemplate({
        organizationId: org.id,
        isRecurring: true,
        frequency: ALL_DAYS,
        defaultCapacity: 20,
      });

      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        makeTripSchedulingConfig({ organizationId: org.id, daysAhead: 3 }),
      );
      mocks.tripTemplateRepository.findActiveRecurringByOrganizationId.mockResolvedValue(
        [template],
      );
      mocks.tripInstanceRepository.countByOrganizationAndMonth.mockResolvedValue(
        0,
      );
      mocks.tripInstanceRepository.existsForTemplateOnDay.mockResolvedValue(
        false,
      );
      mocks.tripInstanceRepository.save.mockImplementation(
        async (entity) => entity,
      );
      mocks.planLimitService.assertMonthlyTripLimit.mockResolvedValue(
        undefined,
      );

      const result = await sut.execute();

      // 3 days, all match, all future → 3 created
      expect(result).toEqual({ created: 3, skipped: 0, failed: 0 });
      expect(mocks.tripInstanceRepository.save).toHaveBeenCalledTimes(3);

      for (const call of mocks.tripInstanceRepository.save.mock.calls) {
        expect(call[0].totalCapacity).toBe(20);
        expect(call[0].tripTemplateId).toBe(template.id);
      }
    });

    it('should skip days not in the template frequency', async () => {
      const org = makeOrganization({ id: 'org-1' });
      const template = makeTripTemplate({
        organizationId: org.id,
        isRecurring: true,
        // Sunday only — PINNED_NOW is a Sunday, so today + 7d match.
        frequency: [DayOfWeek.SUNDAY],
      });

      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        makeTripSchedulingConfig({ organizationId: org.id, daysAhead: 14 }),
      );
      mocks.tripTemplateRepository.findActiveRecurringByOrganizationId.mockResolvedValue(
        [template],
      );
      mocks.tripInstanceRepository.countByOrganizationAndMonth.mockResolvedValue(
        0,
      );
      mocks.tripInstanceRepository.existsForTemplateOnDay.mockResolvedValue(
        false,
      );
      mocks.tripInstanceRepository.save.mockImplementation(
        async (entity) => entity,
      );

      const result = await sut.execute();

      expect(result.created).toBe(2); // today + 7d
      expect(mocks.tripInstanceRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('past-departure guard (fix #4)', () => {
    it('should skip today when departureTime is already in the past', async () => {
      const org = makeOrganization({ id: 'org-1' });
      // Pinned now is 02:00 UTC; "01:00" departure today is 1h in the past.
      const template = makeTripTemplate({
        organizationId: org.id,
        isRecurring: true,
        frequency: ALL_DAYS,
        departureTimeOfDay: '01:00',
        arrivalTimeOfDay: '02:30',
      });

      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        makeTripSchedulingConfig({ organizationId: org.id, daysAhead: 2 }),
      );
      mocks.tripTemplateRepository.findActiveRecurringByOrganizationId.mockResolvedValue(
        [template],
      );
      mocks.tripInstanceRepository.countByOrganizationAndMonth.mockResolvedValue(
        0,
      );
      mocks.tripInstanceRepository.existsForTemplateOnDay.mockResolvedValue(
        false,
      );
      mocks.tripInstanceRepository.save.mockImplementation(
        async (entity) => entity,
      );

      const result = await sut.execute();

      // Today skipped (past), tomorrow created
      expect(result).toEqual({ created: 1, skipped: 1, failed: 0 });
      // Idempotency check shouldn't even fire for the past day — past check is upstream.
      expect(
        mocks.tripInstanceRepository.existsForTemplateOnDay,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('idempotency', () => {
    it('should skip days where an instance already exists for that template', async () => {
      const org = makeOrganization({ id: 'org-1' });
      const template = makeTripTemplate({
        organizationId: org.id,
        isRecurring: true,
        frequency: ALL_DAYS,
      });
      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        makeTripSchedulingConfig({ organizationId: org.id, daysAhead: 2 }),
      );
      mocks.tripTemplateRepository.findActiveRecurringByOrganizationId.mockResolvedValue(
        [template],
      );
      mocks.tripInstanceRepository.countByOrganizationAndMonth.mockResolvedValue(
        0,
      );
      mocks.tripInstanceRepository.existsForTemplateOnDay
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      mocks.tripInstanceRepository.save.mockImplementation(
        async (entity) => entity,
      );

      const result = await sut.execute();

      expect(result).toEqual({ created: 1, skipped: 1, failed: 0 });
      expect(mocks.tripInstanceRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should check idempotency BEFORE plan limit (fix #3)', async () => {
      const org = makeOrganization({ id: 'org-1' });
      const template = makeTripTemplate({
        organizationId: org.id,
        isRecurring: true,
        frequency: ALL_DAYS,
      });
      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        makeTripSchedulingConfig({ organizationId: org.id, daysAhead: 1 }),
      );
      mocks.tripTemplateRepository.findActiveRecurringByOrganizationId.mockResolvedValue(
        [template],
      );
      mocks.tripInstanceRepository.countByOrganizationAndMonth.mockResolvedValue(
        0,
      );
      // The only day in the window already has an instance → plan-limit check must NOT fire.
      mocks.tripInstanceRepository.existsForTemplateOnDay.mockResolvedValue(
        true,
      );

      const result = await sut.execute();

      expect(result).toEqual({ created: 0, skipped: 1, failed: 0 });
      expect(
        mocks.planLimitService.assertMonthlyTripLimit,
      ).not.toHaveBeenCalled();
      expect(mocks.tripInstanceRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('plan limit guard', () => {
    it('should halt the org window once the monthly plan limit is reached', async () => {
      const org = makeOrganization({ id: 'org-1' });
      const template = makeTripTemplate({
        organizationId: org.id,
        isRecurring: true,
        frequency: ALL_DAYS,
      });

      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        makeTripSchedulingConfig({ organizationId: org.id, daysAhead: 5 }),
      );
      mocks.tripTemplateRepository.findActiveRecurringByOrganizationId.mockResolvedValue(
        [template],
      );
      mocks.tripInstanceRepository.countByOrganizationAndMonth.mockResolvedValue(
        0,
      );
      mocks.tripInstanceRepository.existsForTemplateOnDay.mockResolvedValue(
        false,
      );
      mocks.tripInstanceRepository.save.mockImplementation(
        async (entity) => entity,
      );

      mocks.planLimitService.assertMonthlyTripLimit
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new MonthlyTripLimitExceededError(1));

      const result = await sut.execute();

      expect(result.created).toBe(1);
      expect(result.failed).toBe(0);
      expect(mocks.tripInstanceRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('cross-org isolation (fix #1)', () => {
    it('should continue the sweep when one org throws an unexpected error', async () => {
      const badOrg = makeOrganization({ id: 'org-bad' });
      const goodOrg = makeOrganization({ id: 'org-good' });
      const goodTemplate = makeTripTemplate({
        organizationId: goodOrg.id,
        isRecurring: true,
        frequency: ALL_DAYS,
      });

      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        badOrg,
        goodOrg,
      ]);

      // First call (bad org) — config lookup throws an unexpected error.
      // Second call (good org) — returns normally.
      mocks.schedulingConfigRepository.findByOrganizationId
        .mockRejectedValueOnce(new NoActiveSubscriptionError(badOrg.id))
        .mockResolvedValueOnce(
          makeTripSchedulingConfig({
            organizationId: goodOrg.id,
            daysAhead: 1,
          }),
        );
      mocks.tripTemplateRepository.findActiveRecurringByOrganizationId.mockResolvedValue(
        [goodTemplate],
      );
      mocks.tripInstanceRepository.countByOrganizationAndMonth.mockResolvedValue(
        0,
      );
      mocks.tripInstanceRepository.existsForTemplateOnDay.mockResolvedValue(
        false,
      );
      mocks.tripInstanceRepository.save.mockImplementation(
        async (entity) => entity,
      );
      mocks.planLimitService.assertMonthlyTripLimit.mockResolvedValue(
        undefined,
      );

      const result = await sut.execute();

      // Bad org counted as 1 failure; good org still generated its instance.
      expect(result.created).toBe(1);
      expect(result.failed).toBe(1);
      expect(mocks.tripInstanceRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('resilience', () => {
    it('should count instance failures and continue generating', async () => {
      const org = makeOrganization({ id: 'org-1' });
      const template = makeTripTemplate({
        organizationId: org.id,
        isRecurring: true,
        frequency: ALL_DAYS,
      });

      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        makeTripSchedulingConfig({ organizationId: org.id, daysAhead: 3 }),
      );
      mocks.tripTemplateRepository.findActiveRecurringByOrganizationId.mockResolvedValue(
        [template],
      );
      mocks.tripInstanceRepository.countByOrganizationAndMonth.mockResolvedValue(
        0,
      );
      mocks.tripInstanceRepository.existsForTemplateOnDay.mockResolvedValue(
        false,
      );

      let saveCalls = 0;
      mocks.tripInstanceRepository.save.mockImplementation(async (entity) => {
        saveCalls++;
        if (saveCalls === 2) {
          throw new Error('simulated DB write failure');
        }
        return entity;
      });

      const result = await sut.execute();

      expect(result.created).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('should treat a unique-constraint race as skipped, not failed', async () => {
      const org = makeOrganization({ id: 'org-1' });
      const template = makeTripTemplate({
        organizationId: org.id,
        isRecurring: true,
        frequency: ALL_DAYS,
      });

      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        makeTripSchedulingConfig({ organizationId: org.id, daysAhead: 2 }),
      );
      mocks.tripTemplateRepository.findActiveRecurringByOrganizationId.mockResolvedValue(
        [template],
      );
      mocks.tripInstanceRepository.countByOrganizationAndMonth.mockResolvedValue(
        0,
      );
      mocks.tripInstanceRepository.existsForTemplateOnDay.mockResolvedValue(
        false,
      );

      // First save wins, second loses the race → P2002 unique violation.
      // Use a duck-typed error so the test doesn't have to drag in the
      // Prisma runtime; the use-case detection logic matches on `.code`.
      let saveCalls = 0;
      mocks.tripInstanceRepository.save.mockImplementation(async (entity) => {
        saveCalls++;
        if (saveCalls === 2) {
          const err = new Error('Unique constraint failed') as Error & {
            code: string;
          };
          err.code = 'P2002';
          throw err;
        }
        return entity;
      });

      const result = await sut.execute();

      expect(result.created).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  describe('default driver/vehicle promotion to SCHEDULED', () => {
    const DRIVER_ID = '6f9c2c2b-5a9b-4d7a-9c1e-1e2c8a3d4f5a';
    const VEHICLE_ID = '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d';

    function setupOneInstanceRun(
      template: ReturnType<typeof makeTripTemplate>,
    ) {
      const org = makeOrganization({ id: 'org-1' });
      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        makeTripSchedulingConfig({ organizationId: org.id, daysAhead: 1 }),
      );
      mocks.tripTemplateRepository.findActiveRecurringByOrganizationId.mockResolvedValue(
        [template],
      );
      mocks.tripInstanceRepository.countByOrganizationAndMonth.mockResolvedValue(
        0,
      );
      mocks.tripInstanceRepository.existsForTemplateOnDay.mockResolvedValue(
        false,
      );
      mocks.tripInstanceRepository.save.mockImplementation(
        async (entity) => entity,
      );
      mocks.planLimitService.assertMonthlyTripLimit.mockResolvedValue(
        undefined,
      );
      return org;
    }

    it('should promote to SCHEDULED when template has BOTH default driver and vehicle', async () => {
      const template = makeTripTemplate({
        organizationId: 'org-1',
        isRecurring: true,
        frequency: ALL_DAYS,
        defaultDriverId: DRIVER_ID,
        defaultVehicleId: VEHICLE_ID,
      });
      setupOneInstanceRun(template);

      const result = await sut.execute();

      expect(result.created).toBe(1);
      const saved = mocks.tripInstanceRepository.save.mock.calls[0][0];
      expect(saved.tripStatus).toBe(TripStatus.SCHEDULED);
      expect(saved.driverId).toBe(DRIVER_ID);
      expect(saved.vehicleId).toBe(VEHICLE_ID);
    });

    it('should keep DRAFT when template has no defaults', async () => {
      const template = makeTripTemplate({
        organizationId: 'org-1',
        isRecurring: true,
        frequency: ALL_DAYS,
      });
      setupOneInstanceRun(template);

      const result = await sut.execute();

      expect(result.created).toBe(1);
      const saved = mocks.tripInstanceRepository.save.mock.calls[0][0];
      expect(saved.tripStatus).toBe(TripStatus.DRAFT);
      expect(saved.driverId).toBeNull();
      expect(saved.vehicleId).toBeNull();
    });

    it('should keep DRAFT when only defaultDriverId is set (partial defaults)', async () => {
      const template = makeTripTemplate({
        organizationId: 'org-1',
        isRecurring: true,
        frequency: ALL_DAYS,
        defaultDriverId: DRIVER_ID,
      });
      setupOneInstanceRun(template);

      const result = await sut.execute();

      expect(result.created).toBe(1);
      const saved = mocks.tripInstanceRepository.save.mock.calls[0][0];
      expect(saved.tripStatus).toBe(TripStatus.DRAFT);
      expect(saved.driverId).toBeNull();
      expect(saved.vehicleId).toBeNull();
    });

    it('should keep DRAFT when only defaultVehicleId is set (partial defaults)', async () => {
      const template = makeTripTemplate({
        organizationId: 'org-1',
        isRecurring: true,
        frequency: ALL_DAYS,
        defaultVehicleId: VEHICLE_ID,
      });
      setupOneInstanceRun(template);

      const result = await sut.execute();

      expect(result.created).toBe(1);
      const saved = mocks.tripInstanceRepository.save.mock.calls[0][0];
      expect(saved.tripStatus).toBe(TripStatus.DRAFT);
      expect(saved.driverId).toBeNull();
      expect(saved.vehicleId).toBeNull();
    });
  });
});
