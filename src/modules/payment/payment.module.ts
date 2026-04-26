import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { PaymentRepository } from './domain/interfaces/payment.repository';
import { PrismaPaymentRepository } from './infrastructure/db/repositories/prisma-payment.repository';
import {
  FindPaymentByIdUseCase,
  FindPaymentsByOrganizationUseCase,
} from './application/use-cases';
import { PaymentController } from './presentation/controllers/payment.controller';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [PaymentController],
  providers: [
    { provide: PaymentRepository, useClass: PrismaPaymentRepository },
    FindPaymentByIdUseCase,
    FindPaymentsByOrganizationUseCase,
  ],
  exports: [PaymentRepository],
})
export class PaymentModule {}
