import { Injectable, Logger } from '@nestjs/common';
import { OrganizationRepository } from 'src/modules/organization/domain/interfaces/organization.repository';
import { PaymentRepository } from 'src/modules/payment/domain/interfaces/payment.repository';
import { UnitOfWork } from 'src/shared/domain/interfaces/unit-of-work';
import { TripInstanceRepository, TripStatus } from '../../domain/interfaces';

/** Result aggregate returned by {@link CancelExpiredTripInstancesUseCase.execute}. */
export interface CancelExpiredTripInstancesResult {
  canceled: number;
  failed: number;
}

/**
 * Sweep job invoked by the auto-cancel cron. For each active organisation,
 * looks up trip instances whose `autoCancelAt` is already in the past and
 * whose `tripStatus` is still cancellable, then transitions each to
 * `CANCELED` via the entity's state machine.
 *
 * Failures on individual instances are logged and counted, but do not halt
 * the loop — one stuck row should not prevent the rest from being canceled.
 *
 * **MVP scope:** the `minRevenue` rule is intentionally ignored — any
 * non-`forceConfirm` expired instance is canceled regardless of bookings.
 * Honoring `minRevenue` (skip cancellation when realised revenue >= threshold)
 * is tracked as tech-debt for a later iteration.
 */
@Injectable()
export class CancelExpiredTripInstancesUseCase {
  private readonly logger = new Logger(CancelExpiredTripInstancesUseCase.name);

  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(): Promise<CancelExpiredTripInstancesResult> {
    const now = new Date();
    const organizations =
      await this.organizationRepository.findAllActiveUnpaginated();

    let canceled = 0;
    let failed = 0;

    for (const org of organizations) {
      const expired =
        await this.tripInstanceRepository.findExpiredOpenInstances(org.id, now);

      for (const instance of expired) {
        try {
          // One transaction per instance — the trip flip and its payment
          // cascade succeed or roll back together, but one stuck row still
          // does not abort the sweep for the rest of the org.
          await this.unitOfWork.execute(async () => {
            instance.transitionTo(TripStatus.CANCELED);
            await this.tripInstanceRepository.update(instance);

            const payments =
              await this.paymentRepository.findNonFailedByTripInstanceId(
                instance.id,
              );
            for (const payment of payments) {
              payment.fail();
              await this.paymentRepository.update(payment);
            }
          });
          canceled++;
        } catch (err) {
          failed++;
          this.logger.error(
            `Failed to auto-cancel instance ${instance.id} (org=${org.id}): ${(err as Error).message}`,
          );
        }
      }
    }

    this.logger.log(
      `[AutoCancel] sweep complete: canceled=${canceled}, failed=${failed}`,
    );
    return { canceled, failed };
  }
}
