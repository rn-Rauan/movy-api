import { SubscribeToPlanUseCase } from 'src/modules/subscriptions/application/use-cases/subscribe-to-plan.use-case';
import { SubscriptionRepository } from 'src/modules/subscriptions/domain/interfaces/subscription.repository';
import { PlanRepository } from 'src/modules/plans/domain/interfaces/plan.repository';
import { PlanNotFoundError } from 'src/modules/plans/domain/errors/plan.errors';
import {
  SubscriptionAlreadyActiveError,
  SubscriptionCreationFailedError,
} from 'src/modules/subscriptions/domain/errors/subscription.errors';
import { makeSubscription } from '../../factories/subscription.factory';
import { makePlan } from 'test/modules/plans/factories/plan.factory';
import { TransactionManager } from 'src/shared/infrastructure/database/transaction-manager';

const ORG_ID = 'org-id-stub';

function makeMocks() {
  const subscriptionRepository = {
    save: jest.fn(),
    findActiveByOrganizationId: jest.fn(),
  } as any as jest.Mocked<SubscriptionRepository>;

  const planRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<PlanRepository>;

  const transactionManager = {
    runInTransaction: jest.fn(async (fn: () => Promise<unknown>) => fn()),
  } as jest.Mocked<TransactionManager>;

  return { subscriptionRepository, planRepository, transactionManager };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const plan = makePlan({ id: 1, isActive: true, durationDays: 30 });
  const subscription = makeSubscription({ organizationId: ORG_ID, planId: 1 });

  mocks.planRepository.findById.mockResolvedValue(plan);
  mocks.subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
    null,
  );
  mocks.subscriptionRepository.save.mockResolvedValue(subscription);

  return { plan, subscription };
}

describe('SubscribeToPlanUseCase', () => {
  let sut: SubscribeToPlanUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new SubscribeToPlanUseCase(
      mocks.subscriptionRepository,
      mocks.planRepository,
      mocks.transactionManager,
    );
  });

  describe('happy path', () => {
    it('should create and return subscription entity', async () => {
      // Arrange
      const { subscription } = setupHappyPath(mocks);

      // Act
      const result = await sut.execute({ planId: 1 }, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(subscription.id);
      expect(result.organizationId).toBe(ORG_ID);
    });

    it('should call subscriptionRepository.save once', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute({ planId: 1 }, ORG_ID);

      // Assert
      expect(mocks.subscriptionRepository.save).toHaveBeenCalledTimes(1);
      expect(mocks.transactionManager.runInTransaction).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should set expiresAt based on plan.durationDays', async () => {
      // Arrange
      setupHappyPath(mocks);
      const plan60days = makePlan({ id: 1, durationDays: 60, isActive: true });
      mocks.planRepository.findById.mockResolvedValue(plan60days);
      const before = new Date();

      // Act
      await sut.execute({ planId: 1 }, ORG_ID);

      // Assert
      const savedEntity = mocks.subscriptionRepository.save.mock.calls[0][0];
      const expectedMinExpiry = new Date(before);
      expectedMinExpiry.setDate(expectedMinExpiry.getDate() + 59); // at least 59 days from now
      expect(savedEntity.expiresAt.getTime()).toBeGreaterThan(
        expectedMinExpiry.getTime(),
      );
    });
  });

  describe('error - plan not found', () => {
    it('should throw PlanNotFoundError when plan does not exist', async () => {
      // Arrange
      mocks.planRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute({ planId: 99 }, ORG_ID)).rejects.toThrow(
        PlanNotFoundError,
      );
    });

    it('should NOT call save when plan not found', async () => {
      // Arrange
      mocks.planRepository.findById.mockResolvedValue(null);

      // Act
      await expect(sut.execute({ planId: 99 }, ORG_ID)).rejects.toThrow(
        PlanNotFoundError,
      );

      // Assert
      expect(mocks.subscriptionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error - plan inactive', () => {
    it('should throw PlanNotFoundError when plan is inactive', async () => {
      // Arrange
      const inactivePlan = makePlan({ isActive: false });
      mocks.planRepository.findById.mockResolvedValue(inactivePlan);

      // Act & Assert
      await expect(sut.execute({ planId: 1 }, ORG_ID)).rejects.toThrow(
        PlanNotFoundError,
      );
    });

    it('should NOT call save when plan is inactive', async () => {
      // Arrange
      const inactivePlan = makePlan({ isActive: false });
      mocks.planRepository.findById.mockResolvedValue(inactivePlan);

      // Act
      await expect(sut.execute({ planId: 1 }, ORG_ID)).rejects.toThrow(
        PlanNotFoundError,
      );

      // Assert
      expect(mocks.subscriptionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error - already has active subscription', () => {
    it('should throw SubscriptionAlreadyActiveError when org already subscribed', async () => {
      // Arrange
      const plan = makePlan({ isActive: true });
      mocks.planRepository.findById.mockResolvedValue(plan);
      mocks.subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
        makeSubscription({ organizationId: ORG_ID }),
      );

      // Act & Assert
      await expect(sut.execute({ planId: 1 }, ORG_ID)).rejects.toThrow(
        SubscriptionAlreadyActiveError,
      );
    });

    it('should NOT call save when subscription already active', async () => {
      // Arrange
      const plan = makePlan({ isActive: true });
      mocks.planRepository.findById.mockResolvedValue(plan);
      mocks.subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
        makeSubscription({ organizationId: ORG_ID }),
      );

      // Act
      await expect(sut.execute({ planId: 1 }, ORG_ID)).rejects.toThrow(
        SubscriptionAlreadyActiveError,
      );

      // Assert
      expect(mocks.subscriptionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error - persistence failure', () => {
    it('should throw SubscriptionCreationFailedError when save returns null', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.subscriptionRepository.save.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute({ planId: 1 }, ORG_ID)).rejects.toThrow(
        SubscriptionCreationFailedError,
      );
    });

    it('should throw SubscriptionAlreadyActiveError when save fails with P2002', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.subscriptionRepository.save.mockRejectedValue({ code: 'P2002' });

      // Act & Assert
      await expect(sut.execute({ planId: 1 }, ORG_ID)).rejects.toThrow(
        SubscriptionAlreadyActiveError,
      );
    });
  });
});
