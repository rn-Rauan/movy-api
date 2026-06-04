import { GenerateTripInstancesForTemplateUseCase } from 'src/modules/trip/application/use-cases/generate-trip-instances-for-template.use-case';
import {
  GenerateRecurringTripInstancesUseCase,
  ProcessTemplateResult,
} from 'src/modules/trip/application/use-cases/generate-recurring-trip-instances.use-case';
import { TripSchedulingConfigRepository } from 'src/modules/scheduling/domain/interfaces';
import {
  InvalidTripTemplateMissingCapacityError,
  InvalidTripTemplateMissingScheduleError,
  TripTemplateAccessForbiddenError,
  TripTemplateInactiveError,
  TripTemplateNotFoundError,
  TripTemplateNotRecurringError,
} from 'src/modules/trip/domain/entities/errors/trip-template.errors';
import {
  DayOfWeek,
  TripInstanceRepository,
  TripTemplateRepository,
} from 'src/modules/trip/domain/interfaces';
import { makeTripSchedulingConfig } from '../../../scheduling/factories/trip-scheduling-config.factory';
import { makeTripTemplate } from '../../factories/trip-template.factory';
import { PlanLimitService } from 'src/modules/subscriptions/application/services/plan-limit.service';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripTemplateRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<TripTemplateRepository>;

  const tripInstanceRepository = {
    countByOrganizationInPeriod: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  const schedulingConfigRepository = {
    findByOrganizationId: jest.fn(),
  } as any as jest.Mocked<TripSchedulingConfigRepository>;

  const generateRecurringUseCase = {
    processTemplate: jest.fn(),
  } as any as jest.Mocked<GenerateRecurringTripInstancesUseCase>;

  const planLimitService = {
    getCurrentPeriodStart: jest.fn().mockResolvedValue(new Date(0)),
  } as any as jest.Mocked<PlanLimitService>;

  return {
    tripTemplateRepository,
    tripInstanceRepository,
    schedulingConfigRepository,
    generateRecurringUseCase,
    planLimitService,
  };
}

function processTemplateResult(
  overrides: Partial<ProcessTemplateResult> = {},
): ProcessTemplateResult {
  return {
    created: 5,
    skipped: 2,
    failed: 0,
    monthlyCount: 5,
    planLimitHit: false,
    ...overrides,
  };
}

const ORG_ID = 'org-id-stub';
const TEMPLATE_ID = 'tpl-id-stub';

// ── Tests ───────────────────────────────────────────────

describe('GenerateTripInstancesForTemplateUseCase', () => {
  let sut: GenerateTripInstancesForTemplateUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new GenerateTripInstancesForTemplateUseCase(
      mocks.tripTemplateRepository,
      mocks.tripInstanceRepository,
      mocks.schedulingConfigRepository,
      mocks.generateRecurringUseCase,
      mocks.planLimitService,
    );
  });

  describe('happy path', () => {
    it('should delegate to processTemplate and return the result fields', async () => {
      const template = makeTripTemplate({
        id: TEMPLATE_ID,
        organizationId: ORG_ID,
        isRecurring: true,
        frequency: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        defaultCapacity: 20,
      });

      mocks.tripTemplateRepository.findById.mockResolvedValue(template);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        makeTripSchedulingConfig({ organizationId: ORG_ID, daysAhead: 7 }),
      );
      mocks.tripInstanceRepository.countByOrganizationInPeriod.mockResolvedValue(
        3,
      );
      mocks.generateRecurringUseCase.processTemplate.mockResolvedValue(
        processTemplateResult({ created: 4, skipped: 3, failed: 0 }),
      );

      const result = await sut.execute(TEMPLATE_ID, ORG_ID);

      expect(result).toEqual({ created: 4, skipped: 3, failed: 0 });
      expect(
        mocks.generateRecurringUseCase.processTemplate,
      ).toHaveBeenCalledTimes(1);
      const [templateArg, orgArg, daysAheadArg, , monthlyCountArg] =
        mocks.generateRecurringUseCase.processTemplate.mock.calls[0];
      expect(templateArg).toBe(template);
      expect(orgArg).toBe(ORG_ID);
      expect(daysAheadArg).toBe(7); // from org scheduling config
      expect(monthlyCountArg).toBe(3); // baseline from countByOrganizationInPeriod
    });

    it('should honour daysAheadOverride over the org scheduling config', async () => {
      const template = makeTripTemplate({
        id: TEMPLATE_ID,
        organizationId: ORG_ID,
        isRecurring: true,
        frequency: [DayOfWeek.MONDAY],
      });

      mocks.tripTemplateRepository.findById.mockResolvedValue(template);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        makeTripSchedulingConfig({ organizationId: ORG_ID, daysAhead: 7 }),
      );
      mocks.tripInstanceRepository.countByOrganizationInPeriod.mockResolvedValue(
        0,
      );
      mocks.generateRecurringUseCase.processTemplate.mockResolvedValue(
        processTemplateResult(),
      );

      await sut.execute(TEMPLATE_ID, ORG_ID, 30);

      const daysAheadArg =
        mocks.generateRecurringUseCase.processTemplate.mock.calls[0][2];
      expect(daysAheadArg).toBe(30);
      // Override path doesn't consult the config repository.
      expect(
        mocks.schedulingConfigRepository.findByOrganizationId,
      ).not.toHaveBeenCalled();
    });

    it('should fall back to the global default of 14 when config is absent and no override', async () => {
      const template = makeTripTemplate({
        id: TEMPLATE_ID,
        organizationId: ORG_ID,
        isRecurring: true,
        frequency: [DayOfWeek.MONDAY],
      });

      mocks.tripTemplateRepository.findById.mockResolvedValue(template);
      mocks.schedulingConfigRepository.findByOrganizationId.mockResolvedValue(
        null,
      );
      mocks.tripInstanceRepository.countByOrganizationInPeriod.mockResolvedValue(
        0,
      );
      mocks.generateRecurringUseCase.processTemplate.mockResolvedValue(
        processTemplateResult(),
      );

      await sut.execute(TEMPLATE_ID, ORG_ID);

      const daysAheadArg =
        mocks.generateRecurringUseCase.processTemplate.mock.calls[0][2];
      expect(daysAheadArg).toBe(14);
    });
  });

  describe('validation errors', () => {
    it('should throw TripTemplateNotFoundError when the template is missing', async () => {
      mocks.tripTemplateRepository.findById.mockResolvedValue(null);

      await expect(sut.execute(TEMPLATE_ID, ORG_ID)).rejects.toThrow(
        TripTemplateNotFoundError,
      );
      expect(
        mocks.generateRecurringUseCase.processTemplate,
      ).not.toHaveBeenCalled();
    });

    it('should throw TripTemplateAccessForbiddenError when the template belongs to another org', async () => {
      const template = makeTripTemplate({
        id: TEMPLATE_ID,
        organizationId: 'someone-else',
        isRecurring: true,
        frequency: [DayOfWeek.MONDAY],
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);

      await expect(sut.execute(TEMPLATE_ID, ORG_ID)).rejects.toThrow(
        TripTemplateAccessForbiddenError,
      );
    });

    it('should throw TripTemplateInactiveError for inactive templates', async () => {
      const template = makeTripTemplate({
        id: TEMPLATE_ID,
        organizationId: ORG_ID,
        isRecurring: true,
        frequency: [DayOfWeek.MONDAY],
        status: 'INACTIVE',
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);

      await expect(sut.execute(TEMPLATE_ID, ORG_ID)).rejects.toThrow(
        TripTemplateInactiveError,
      );
    });

    it('should throw TripTemplateNotRecurringError when isRecurring=false', async () => {
      const template = makeTripTemplate({
        id: TEMPLATE_ID,
        organizationId: ORG_ID,
        isRecurring: false,
        frequency: [],
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);

      await expect(sut.execute(TEMPLATE_ID, ORG_ID)).rejects.toThrow(
        TripTemplateNotRecurringError,
      );
    });

    it('should throw InvalidTripTemplateMissingScheduleError for legacy rows without time-of-day', async () => {
      const template = makeTripTemplate({
        id: TEMPLATE_ID,
        organizationId: ORG_ID,
        isRecurring: true,
        frequency: [DayOfWeek.MONDAY],
        departureTimeOfDay: null,
        arrivalTimeOfDay: null,
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);

      await expect(sut.execute(TEMPLATE_ID, ORG_ID)).rejects.toThrow(
        InvalidTripTemplateMissingScheduleError,
      );
    });

    it('should throw InvalidTripTemplateMissingCapacityError for legacy rows without defaultCapacity', async () => {
      const template = makeTripTemplate({
        id: TEMPLATE_ID,
        organizationId: ORG_ID,
        isRecurring: true,
        frequency: [DayOfWeek.MONDAY],
        defaultCapacity: null,
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);

      await expect(sut.execute(TEMPLATE_ID, ORG_ID)).rejects.toThrow(
        InvalidTripTemplateMissingCapacityError,
      );
    });

    it('should reject programmatic daysAheadOverride outside the [1, 90] range', async () => {
      const template = makeTripTemplate({
        id: TEMPLATE_ID,
        organizationId: ORG_ID,
        isRecurring: true,
        frequency: [DayOfWeek.MONDAY],
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);
      mocks.tripInstanceRepository.countByOrganizationInPeriod.mockResolvedValue(
        0,
      );

      await expect(sut.execute(TEMPLATE_ID, ORG_ID, 0)).rejects.toThrow(
        RangeError,
      );
      await expect(sut.execute(TEMPLATE_ID, ORG_ID, 91)).rejects.toThrow(
        RangeError,
      );
      await expect(sut.execute(TEMPLATE_ID, ORG_ID, 1.5)).rejects.toThrow(
        RangeError,
      );
    });
  });
});
