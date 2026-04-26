import { FindBookingsByTripInstanceUseCase } from 'src/modules/bookings/application/use-cases/find-bookings-by-trip-instance.use-case';
import { BookingRepository } from 'src/modules/bookings/domain/interfaces/booking.repository';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { TripInstanceNotFoundError } from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { BookingAccessForbiddenError } from 'src/modules/bookings/domain/entities/errors/booking.errors';
import { Booking } from 'src/modules/bookings/domain/entities';
import { PaginatedResponse } from 'src/shared/domain/interfaces';
import { makeBooking } from '../../factories/booking.factory';
import { makeTripInstance } from 'test/modules/trip/factories/trip-instance.factory';

// â”€â”€ Mocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function makeMocks() {
  const bookingRepository = {
    findByTripInstanceId: jest.fn(),
  } as any as jest.Mocked<BookingRepository>;

  const tripInstanceRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  return { bookingRepository, tripInstanceRepository };
}

function makePaginatedResponse(items: Booking[]): PaginatedResponse<Booking> {
  return {
    data: items,
    total: items.length,
    page: 1,
    limit: 10,
    totalPages: 1,
  };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const instance = makeTripInstance({ organizationId: ORG_ID });
  const bookings = [
    makeBooking({ organizationId: ORG_ID, tripInstanceId: TRIP_INSTANCE_ID }),
    makeBooking({ organizationId: ORG_ID, tripInstanceId: TRIP_INSTANCE_ID }),
  ];
  const paginated = makePaginatedResponse(bookings);

  mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
  mocks.bookingRepository.findByTripInstanceId.mockResolvedValue(paginated);

  return { instance, bookings, paginated };
}

// â”€â”€ Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ORG_ID = 'org-id-stub';
const TRIP_INSTANCE_ID = 'trip-instance-id-stub';
const PAGINATION = { page: 1, limit: 10 };

describe('FindBookingsByTripInstanceUseCase', () => {
  let sut: FindBookingsByTripInstanceUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindBookingsByTripInstanceUseCase(
      mocks.bookingRepository,
      mocks.tripInstanceRepository,
    );
  });

  // â”€â”€ req 11: dono da viagem visualiza todos os inscritos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('happy path', () => {
    it('should return all bookings for the trip instance', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(TRIP_INSTANCE_ID, PAGINATION, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should call repository.findByTripInstanceId with correct args', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(TRIP_INSTANCE_ID, PAGINATION, ORG_ID);

      // Assert
      expect(mocks.bookingRepository.findByTripInstanceId).toHaveBeenCalledWith(
        TRIP_INSTANCE_ID,
        PAGINATION,
      );
    });

    it('should validate trip instance ownership before returning bookings', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(TRIP_INSTANCE_ID, PAGINATION, ORG_ID);

      // Assert â€” trip instance checked first
      expect(mocks.tripInstanceRepository.findById).toHaveBeenCalledWith(
        TRIP_INSTANCE_ID,
      );
    });

    it('should map entities to response dtos', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(TRIP_INSTANCE_ID, PAGINATION, ORG_ID);

      // Assert
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('userId');
    });
  });

  describe('error â€” trip instance not found', () => {
    it('should throw TripInstanceNotFoundError when trip does not exist', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(TRIP_INSTANCE_ID, PAGINATION)).rejects.toThrow(
        TripInstanceNotFoundError,
      );
    });

    it('should NOT call booking repo when trip not found', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act
      await expect(sut.execute(TRIP_INSTANCE_ID, PAGINATION)).rejects.toThrow(
        TripInstanceNotFoundError,
      );

      // Assert
      expect(
        mocks.bookingRepository.findByTripInstanceId,
      ).not.toHaveBeenCalled();
    });
  });

  // seguranca: so org member ve a lista de passageiros
  describe('error -- unauthorized caller (no org access)', () => {
    it('should throw BookingAccessForbiddenError when caller org does not match trip org', async () => {
      setupHappyPath(mocks);
      await expect(
        sut.execute(TRIP_INSTANCE_ID, PAGINATION, 'other-org'),
      ).rejects.toThrow(BookingAccessForbiddenError);
    });

    it('should throw BookingAccessForbiddenError for B2C user (no org)', async () => {
      setupHappyPath(mocks);
      await expect(sut.execute(TRIP_INSTANCE_ID, PAGINATION)).rejects.toThrow(
        BookingAccessForbiddenError,
      );
    });

    it('should NOT call booking repo when access is denied', async () => {
      setupHappyPath(mocks);
      await expect(
        sut.execute(TRIP_INSTANCE_ID, PAGINATION, 'other-org'),
      ).rejects.toThrow(BookingAccessForbiddenError);
      expect(
        mocks.bookingRepository.findByTripInstanceId,
      ).not.toHaveBeenCalled();
    });
  });
});
