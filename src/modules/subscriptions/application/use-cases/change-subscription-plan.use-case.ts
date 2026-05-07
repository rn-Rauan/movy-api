import { Injectable } from '@nestjs/common';
import { PlanRepository } from 'src/modules/plans/domain/interfaces/plan.repository';
import { PlanNotFoundError } from 'src/modules/plans/domain/errors/plan.errors';
import { SubscriptionRepository } from '../../domain/interfaces/subscription.repository';
import { SubscriptionStatus } from '../../domain/interfaces/enums/subscription-status.enum';
import {
  SubscriptionForbiddenError,
  SubscriptionNotActiveError,
  SubscriptionNotFoundError,
} from '../../domain/errors/subscription.errors';
import { UpdateSubscriptionPlanDto } from '../dtos';

/**
 * Replaces the plan of an existing ACTIVE subscription, recalculating `expiresAt`
 * from the new plan's `durationDays`.
 *
 * Preserves the same subscription record (id, startDate, createdAt) so the historical
 * trail of the organisation's subscription is kept intact. Compared to cancel + subscribe,
 * this avoids the unique-key race condition between the two writes.
 *
 * @remarks
 * If the new `planId` matches the current one, the call is a no-op and the existing
 * subscription is returned unchanged.
 */
@Injectable()
export class ChangeSubscriptionPlanUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
  ) {}

  /**
   * Validates ownership, status and the new plan, then swaps the plan and persists.
   *
   * @param id - UUID of the subscription to update
   * @param dto - Validated body containing the new `planId`
   * @param organizationId - UUID of the requesting organisation (tenant check)
   * @returns The updated {@link SubscriptionEntity} with the new `planId` and `expiresAt`
   * @throws {@link SubscriptionNotFoundError} if no subscription with the given `id` exists
   * @throws {@link SubscriptionForbiddenError} if the subscription belongs to a different organisation
   * @throws {@link SubscriptionNotActiveError} if the subscription is CANCELED or PAST_DUE
   * @throws {@link PlanNotFoundError} if the new plan does not exist or is inactive
   */
  async execute(
    id: string,
    dto: UpdateSubscriptionPlanDto,
    organizationId: string,
  ) {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new SubscriptionNotFoundError(id);
    }

    if (subscription.organizationId !== organizationId) {
      throw new SubscriptionForbiddenError(id);
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new SubscriptionNotActiveError(id);
    }

    if (subscription.planId === dto.planId) {
      return subscription;
    }

    const plan = await this.planRepository.findById(dto.planId);
    if (!plan || !plan.isActive) {
      throw new PlanNotFoundError(dto.planId);
    }

    subscription.changePlan(plan.id, plan.durationDays);

    const updated = await this.subscriptionRepository.update(subscription);
    if (!updated) {
      throw new SubscriptionNotFoundError(id);
    }

    return updated;
  }
}
