import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { PaymentRepository } from './domain/interfaces/payment.repository';
import { PrismaPaymentRepository } from './infrastructure/db/repositories/prisma-payment.repository';
import {
  FindPaymentByIdUseCase,
  FindPaymentsByOrganizationUseCase,
  ConfirmPaymentUseCase,
  FailPaymentUseCase,
} from './application/use-cases';
import { PaymentController } from './presentation/controllers/payment.controller';

/**
 * NestJS module responsible for managing payment transactions on the Movy platform.
 *
 * Payments are created implicitly by the `CreateBookingUseCase` in the Bookings module.
 * This module exports {@link PaymentRepository} so that other modules can persist payments
 * without importing the full `PaymentModule` providers.
 *
 * All read endpoints require the `ADMIN` role and are scoped to the requesting organisation.
 */
@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [PaymentController],
  providers: [
    { provide: PaymentRepository, useClass: PrismaPaymentRepository },
    FindPaymentByIdUseCase,
    FindPaymentsByOrganizationUseCase,
    ConfirmPaymentUseCase,
    FailPaymentUseCase,
  ],
  exports: [PaymentRepository],
})
export class PaymentModule {}
