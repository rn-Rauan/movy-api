import { Injectable } from '@nestjs/common';
import { PlanRepository } from 'src/modules/plans/domain/interfaces/plan.repository';
import { PlanNotFoundError } from 'src/modules/plans/domain/errors/plan.errors';
import { SubscriptionRepository } from '../../domain/interfaces/subscription.repository';
import { resolveActiveSubscription } from '../utils/resolve-active-subscription';
import { billingPeriodStart } from '../utils/billing-period';
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
   * Returns the start of the organisation's current billing-period window
   * (`expiresAt − plan.durationDays`). Resource-usage counts should use this
   * as the lower bound so quotas reset with the subscription cycle, not the
   * calendar month.
   *
   * @throws NoActiveSubscriptionError when the org has no valid subscription
   * @throws PlanNotFoundError when the plan referenced by the subscription no longer exists
   */
  async getCurrentPeriodStart(organizationId: string): Promise<Date> {
    const { subscription, plan } =
      await this.getActiveSubscriptionAndPlan(organizationId);
    return billingPeriodStart(subscription.expiresAt, plan.durationDays);
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
