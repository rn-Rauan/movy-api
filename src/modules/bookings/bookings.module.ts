import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { TripModule } from 'src/modules/trip/trip.module';
import { PaymentModule } from 'src/modules/payment/payment.module';
import {
  CancelBookingUseCase,
  ConfirmPresenceUseCase,
  CreateBookingUseCase,
  FindBookingByIdUseCase,
  FindBookingDetailsUseCase,
  FindBookingsByOrganizationUseCase,
  FindBookingsByTripInstanceUseCase,
  FindBookingsByUserUseCase,
  GetBookingAvailabilityUseCase,
} from './application/use-cases';
import { BookingRepository } from './domain/interfaces';
import { PrismaBookingRepository } from './infrastructure/db/repositories/prisma-booking.repository';
import { BookingController } from './presentation/controllers/booking.controller';

/**
 * NestJS module responsible for managing bookings (passenger enrollments in trip instances).
 *
 * Imports:
 * - `TripModule` — provides `TripInstanceRepository` and `TripTemplateRepository`
 *   for trip validation and price resolution
 * - `PaymentModule` — provides `PaymentRepository` for creating the initial `PENDING`
 *   payment record atomically with each new booking via `TransactionManager`
 *
 * `TransactionManager` is provided globally by `PrismaModule` (via `SharedModule`).
 * Does **not** export `BookingRepository` — no other module queries bookings directly.
 */
@Module({
  imports: [PrismaModule, SharedModule, TripModule, PaymentModule],
  controllers: [BookingController],
  providers: [
    CreateBookingUseCase,
    CancelBookingUseCase,
    ConfirmPresenceUseCase,
    FindBookingByIdUseCase,
    FindBookingDetailsUseCase,
    FindBookingsByOrganizationUseCase,
    FindBookingsByTripInstanceUseCase,
    FindBookingsByUserUseCase,
    GetBookingAvailabilityUseCase,
    {
      provide: BookingRepository,
      useClass: PrismaBookingRepository,
    },
  ],
})
export class BookingsModule {}
