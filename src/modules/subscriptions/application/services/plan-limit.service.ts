import { Injectable } from '@nestjs/common';
import { PlanRepository } from 'src/modules/plans/domain/interfaces/plan.repository';
import { PlanNotFoundError } from 'src/modules/plans/domain/errors/plan.errors';
import { SubscriptionRepository } from '../../domain/interfaces/subscription.repository';
import { resolveActiveSubscription } from '../utils/resolve-active-subscription';
import {
  NoActiveSubscriptionError,
  VehicleLimitExceededError,
  DriverLimitExceededError,
  MonthlyTripLimitExceededError,
} from '../../domain/errors/subscription.errors';

/**
 * Centralised service for enforcing plan resource limits.
 *
 * Each `assert*` method resolves the active subscription (lazily expiring it if needed),
 * fetches the linked plan, and throws the appropriate error when the current resource
 * count is at or above the plan's configured maximum.
 *
 * Consumers are responsible for counting their own resources before calling this service.
 */
@Injectable()
export class PlanLimitService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
  ) {}

  /**
   * Resolves the active subscription and its linked plan in one pass.
   * Lazily expires overdue subscriptions.
   *
   * @throws NoActiveSubscriptionError when the org has no valid subscription
   * @throws PlanNotFoundError when the plan referenced by the subscription no longer exists
   */
  private async getActiveSubscriptionAndPlan(organizationId: string) {
    const subscription = await resolveActiveSubscription(
      organizationId,
      this.subscriptionRepository,
    );
    if (!subscription) throw new NoActiveSubscriptionError(organizationId);

    const plan = await this.planRepository.findById(subscription.planId);
    if (!plan) throw new PlanNotFoundError(subscription.planId);

    return { subscription, plan };
  }

  /**
   * Resolves the active subscription and returns the linked plan.
   * Lazily expires overdue subscriptions.
   *
   * @throws NoActiveSubscriptionError when the org has no valid subscription
   * @throws PlanNotFoundError when the plan referenced by the subscription no longer exists
   */
  private async getActivePlan(organizationId: string) {
    const { plan } = await this.getActiveSubscriptionAndPlan(organizationId);
    return plan;
  }

  /**
   * Returns the active subscription's term window `[start, end)` where
   * `start = subscription.startDate` (the original enrolment instant) and
   * `end = subscription.expiresAt`.
   *
   * Trip-usage counts use this window with the **creation time** so the quota
   * covers every non-draft trip created since enrolment, and only resets when a
   * fresh subscription term begins (a renewal/re-subscribe produces a new
   * `startDate`). A mid-term plan change preserves `startDate`, so upgrading does
   * not wipe the trip history accumulated in the current term.
   *
   * @throws NoActiveSubscriptionError when the org has no valid subscription
   * @throws PlanNotFoundError when the plan referenced by the subscription no longer exists
   */
  async getCurrentPeriod(
    organizationId: string,
  ): Promise<{ start: Date; end: Date }> {
    const { subscription } =
      await this.getActiveSubscriptionAndPlan(organizationId);
    return {
      start: subscription.startDate,
      end: subscription.expiresAt,
    };
  }

  /**
   * Asserts that adding one more vehicle will not exceed `plan.maxVehicles`.
   *
   * @param organizationId - The requesting organisation's UUID
   * @param currentCount - Number of currently active vehicles in the organisation
   * @throws VehicleLimitExceededError when `currentCount >= plan.maxVehicles`
   */
  async assertVehicleLimit(
    organizationId: string,
    currentCount: number,
  ): Promise<void> {
    const plan = await this.getActivePlan(organizationId);
    if (currentCount >= plan.maxVehicles) {
      throw new VehicleLimitExceededError(plan.maxVehicles);
    }
  }

  /**
   * Asserts that adding one more driver will not exceed `plan.maxDrivers`.
   *
   * @param organizationId - The requesting organisation's UUID
   * @param currentCount - Number of currently active drivers in the organisation
   * @throws DriverLimitExceededError when `currentCount >= plan.maxDrivers`
   */
  async assertDriverLimit(
    organizationId: string,
    currentCount: number,
  ): Promise<void> {
    const plan = await this.getActivePlan(organizationId);
    if (currentCount >= plan.maxDrivers) {
      throw new DriverLimitExceededError(plan.maxDrivers);
    }
  }

  /**
   * Asserts that scheduling one more trip in the current billing period will
   * not exceed `plan.maxMonthlyTrips`.
   *
   * @param organizationId - The requesting organisation's UUID
   * @param currentCount - Number of trip instances already created in the current billing period
   * @throws MonthlyTripLimitExceededError when `currentCount >= plan.maxMonthlyTrips`
   */
  async assertMonthlyTripLimit(
    organizationId: string,
    currentCount: number,
  ): Promise<void> {
    const plan = await this.getActivePlan(organizationId);
    if (currentCount >= plan.maxMonthlyTrips) {
      throw new MonthlyTripLimitExceededError(plan.maxMonthlyTrips);
    }
  }
}
