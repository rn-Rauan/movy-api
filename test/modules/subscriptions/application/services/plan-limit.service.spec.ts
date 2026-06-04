import { PlanLimitService } from 'src/modules/subscriptions/application/services/plan-limit.service';
import { SubscriptionRepository } from 'src/modules/subscriptions/domain/interfaces/subscription.repository';
import { PlanRepository } from 'src/modules/plans/domain/interfaces/plan.repository';
import {
  NoActiveSubscriptionError,
  VehicleLimitExceededError,
} from 'src/modules/subscriptions/domain/errors/subscription.errors';
import { PlanNotFoundError } from 'src/modules/plans/domain/errors/plan.errors';
import { makeSubscription } from '../../factories/subscription.factory';
import { makePlan } from '../../../plans/factories/plan.factory';

const ORG_ID = 'org-id-stub';

function makeMocks() {
  const subscriptionRepository = {
    findActiveByOrganizationId: jest.fn(),
    update: jest.fn(),
  } as any as jest.Mocked<SubscriptionRepository>;

  const planRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<PlanRepository>;

  return { subscriptionRepository, planRepository };
}

describe('PlanLimitService', () => {
  let sut: PlanLimitService;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new PlanLimitService(
      mocks.subscriptionRepository,
      mocks.planRepository,
    );
  });

  describe('getCurrentPeriodStart', () => {
    it('should return expiresAt minus plan.durationDays', async () => {
      const expiresAt = new Date(Date.UTC(2026, 5, 30, 12, 0, 0)); // future relative to 2026 tests
      jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2026, 5, 10)));

      mocks.subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
        makeSubscription({ organizationId: ORG_ID, planId: 1, expiresAt }),
      );
      mocks.planRepository.findById.mockResolvedValue(
        makePlan({ id: 1, durationDays: 30 }),
      );

      const start = await sut.getCurrentPeriodStart(ORG_ID);

      expect(start).toEqual(new Date(Date.UTC(2026, 4, 31, 12, 0, 0)));
      jest.useRealTimers();
    });

    it('should throw NoActiveSubscriptionError when there is no active subscription', async () => {
      mocks.subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
        null,
      );

      await expect(sut.getCurrentPeriodStart(ORG_ID)).rejects.toBeInstanceOf(
        NoActiveSubscriptionError,
      );
    });

    it('should throw PlanNotFoundError when the linked plan is missing', async () => {
      mocks.subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
        makeSubscription({ organizationId: ORG_ID, planId: 99 }),
      );
      mocks.planRepository.findById.mockResolvedValue(null);

      await expect(sut.getCurrentPeriodStart(ORG_ID)).rejects.toBeInstanceOf(
        PlanNotFoundError,
      );
    });
  });

  describe('assert* limits (regression — refactor kept behaviour)', () => {
    it('should throw when the current count is at the plan maximum', async () => {
      mocks.subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
        makeSubscription({ organizationId: ORG_ID, planId: 1 }),
      );
      mocks.planRepository.findById.mockResolvedValue(
        makePlan({ id: 1, maxVehicles: 3 }),
      );

      await expect(sut.assertVehicleLimit(ORG_ID, 3)).rejects.toBeInstanceOf(
        VehicleLimitExceededError,
      );
    });

    it('should pass when below the plan maximum', async () => {
      mocks.subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
        makeSubscription({ organizationId: ORG_ID, planId: 1 }),
      );
      mocks.planRepository.findById.mockResolvedValue(
        makePlan({ id: 1, maxVehicles: 3 }),
      );

      await expect(sut.assertVehicleLimit(ORG_ID, 2)).resolves.toBeUndefined();
    });
  });
});
