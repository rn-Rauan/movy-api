import { Injectable } from '@nestjs/common';
import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import { DriverStatus } from 'src/modules/driver/domain/interfaces/enums/driver-status.enum';
import { RoleName } from 'src/shared/domain/types';
import { PaymentRepository } from '../../domain/interfaces/payment.repository';
import { PaymentStatus } from '../../domain/interfaces/enums/payment-status.enum';
import {
  PaymentNotFoundError,
  PaymentAlreadyProcessedError,
  PaymentNotAssignedToDriverError,
} from '../../domain/errors/payment.errors';
import { PaymentEntity } from '../../domain/entities/payment.entity';

/**
 * Calling context for confirm/fail payment use cases.
 *
 * `role` follows the same shape as {@link TenantContext.role}. When `role` is
 * `DRIVER`, the use case enforces a driver-ownership check; for `ADMIN` it
 * relies on the tenant filter alone.
 */
export interface PaymentActorContext {
  userId: string;
  role?: 'ADMIN' | 'DRIVER' | null;
}

/**
 * Simulates payment confirmation by transitioning a PENDING payment to COMPLETED.
 *
 * This is a simulated flow — no external payment gateway is involved.
 * Guards:
 * - Only PENDING payments may be confirmed; already-processed ones are rejected.
 * - When the caller is a `DRIVER`, the use case resolves the driver profile
 *   linked to `userId` and rejects the request unless the payment's TripInstance
 *   is assigned to that driver.
 */
@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly driverRepository: DriverRepository,
  ) {}

  /**
   * Confirms a payment.
   *
   * @param id - UUID of the payment to confirm
   * @param organizationId - Requesting organisation; validates tenant ownership
   * @param ctx - Acting user + role; drives the driver-ownership check
   * @returns The updated {@link PaymentEntity} with status COMPLETED
   * @throws PaymentNotFoundError if no payment matches the id
   * @throws PaymentAlreadyProcessedError if the payment is not PENDING
   * @throws PaymentNotAssignedToDriverError if a DRIVER caller is not the
   *   assigned driver of the payment's TripInstance
   */
  async execute(
    id: string,
    organizationId: string,
    ctx: PaymentActorContext,
  ): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment || payment.organizationId !== organizationId) {
      throw new PaymentNotFoundError(id);
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new PaymentAlreadyProcessedError(id);
    }

    if (ctx.role === RoleName.DRIVER) {
      const [driver, assignedDriverId] = await Promise.all([
        this.driverRepository.findByUserId(ctx.userId),
        this.paymentRepository.findDriverIdByPaymentId(id),
      ]);
      if (
        !driver ||
        driver.driverStatus !== DriverStatus.ACTIVE ||
        !assignedDriverId ||
        driver.id !== assignedDriverId
      ) {
        throw new PaymentNotAssignedToDriverError(id);
      }
    }

    payment.confirm();
    const updated = await this.paymentRepository.update(payment);
    return updated ?? payment;
  }
}
