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

  describe('getCurrentPeriod', () => {
    it('should return start = subscription.startDate and end = expiresAt (term spans a mid-cycle upgrade)', async () => {
      // startDate is the original enrolment; expiresAt was pushed forward by a
      // later plan change — the term window must still start at enrolment.
      const startDate = new Date(Date.UTC(2026, 4, 24, 16, 46, 0)); // 2026-05-24
      const expiresAt = new Date(Date.UTC(2026, 6, 3, 16, 52, 0)); // 2026-07-03 (40d span)

      mocks.subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
        makeSubscription({
          organizationId: ORG_ID,
          planId: 1,
          startDate,
          expiresAt,
        }),
      );
      mocks.planRepository.findById.mockResolvedValue(
        makePlan({ id: 1, durationDays: 30 }),
      );

      const period = await sut.getCurrentPeriod(ORG_ID);

      expect(period.start).toEqual(startDate);
      expect(period.end).toEqual(expiresAt);
    });

    it('should throw NoActiveSubscriptionError when there is no active subscription', async () => {
      mocks.subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
        null,
      );

      await expect(sut.getCurrentPeriod(ORG_ID)).rejects.toBeInstanceOf(
        NoActiveSubscriptionError,
      );
    });

    it('should throw PlanNotFoundError when the linked plan is missing', async () => {
      mocks.subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
        makeSubscription({ organizationId: ORG_ID, planId: 99 }),
      );
      mocks.planRepository.findById.mockResolvedValue(null);

      await expect(sut.getCurrentPeriod(ORG_ID)).rejects.toBeInstanceOf(
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
