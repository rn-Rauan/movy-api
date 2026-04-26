import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { TripModule } from 'src/modules/trip/trip.module';
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

@Module({
  imports: [PrismaModule, SharedModule, TripModule],
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
