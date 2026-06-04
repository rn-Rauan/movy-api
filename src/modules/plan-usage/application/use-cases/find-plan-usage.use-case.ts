import { Injectable } from '@nestjs/common';
import { PlanRepository } from 'src/modules/plans/domain/interfaces/plan.repository';
import { PlanNotFoundError } from 'src/modules/plans/domain/errors/plan.errors';
import { SubscriptionRepository } from 'src/modules/subscriptions/domain/interfaces/subscription.repository';
import { resolveActiveSubscription } from 'src/modules/subscriptions/application/utils/resolve-active-subscription';
import { billingPeriodStart } from 'src/modules/subscriptions/application/utils/billing-period';
import { NoActiveSubscriptionError } from 'src/modules/subscriptions/domain/errors/subscription.errors';
import { VehicleRepository } from 'src/modules/vehicle/domain/interfaces';
import { DriverRepository } from 'src/modules/driver/domain/interfaces';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces';

export interface PlanUsageOutput {
  vehicles: { used: number; max: number };
  drivers: { used: number; max: number };
  monthlyTrips: { used: number; max: number };
}

/**
 * Reports the organisation's current resource consumption against its active plan.
 *
 * Resolves the active subscription (lazily expiring if overdue), loads the linked
 * plan, and counts active vehicles, active drivers, and trip instances created in
 * the current billing period (`expiresAt − plan.durationDays`).
 *
 * @throws NoActiveSubscriptionError when the org has no valid subscription
 * @throws PlanNotFoundError when the plan referenced by the subscription is missing
 */
@Injectable()
export class FindPlanUsageUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly driverRepository: DriverRepository,
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  async execute(organizationId: string): Promise<PlanUsageOutput> {
    const subscription = await resolveActiveSubscription(
      organizationId,
      this.subscriptionRepository,
    );
    if (!subscription) throw new NoActiveSubscriptionError(organizationId);

    const plan = await this.planRepository.findById(subscription.planId);
    if (!plan) throw new PlanNotFoundError(subscription.planId);

    const now = new Date();
    const periodStart = billingPeriodStart(
      subscription.expiresAt,
      plan.durationDays,
    );

    const [vehiclesUsed, driversUsed, tripsUsed] = await Promise.all([
      this.vehicleRepository.countActiveByOrganizationId(organizationId),
      this.driverRepository.countActiveByOrganizationId(organizationId),
      this.tripInstanceRepository.countByOrganizationInPeriod(
        organizationId,
        periodStart,
        now,
      ),
    ]);

    return {
      vehicles: { used: vehiclesUsed, max: plan.maxVehicles },
      drivers: { used: driversUsed, max: plan.maxDrivers },
      monthlyTrips: { used: tripsUsed, max: plan.maxMonthlyTrips },
    };
  }
}
