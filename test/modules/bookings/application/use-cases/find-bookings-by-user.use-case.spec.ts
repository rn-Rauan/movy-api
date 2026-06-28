import { FindBookingsByUserUseCase } from 'src/modules/bookings/application/use-cases/find-bookings-by-user.use-case';
import {
  BookingRepository,
  BookingWithTripMeta,
} from 'src/modules/bookings/domain/interfaces/booking.repository';
import { Booking } from 'src/modules/bookings/domain/entities';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import { PaginatedResponse } from 'src/shared/domain/interfaces';
import { makeBooking } from '../../factories/booking.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const bookingRepository = {
    findByUserIdWithTrip: jest.fn(),
  } as any as jest.Mocked<BookingRepository>;

  return { bookingRepository };
}

function toMeta(booking: Booking): BookingWithTripMeta {
  return {
    booking,
    tripStatus: TripStatus.SCHEDULED,
    tripDepartureTime: new Date('2026-06-15T07:30:00.000Z'),
  };
}

function makePaginatedResponse(
  items: Booking[],
): PaginatedResponse<BookingWithTripMeta> {
  return {
    data: items.map(toMeta),
    total: items.length,
    page: 1,
    limit: 10,
    totalPages: 1,
  };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const bookings = [
    makeBooking({ userId: USER_ID }),
    makeBooking({ userId: USER_ID }),
  ];
  const paginated = makePaginatedResponse(bookings);

  mocks.bookingRepository.findByUserIdWithTrip.mockResolvedValue(paginated);

  return { bookings, paginated };
}

// ── Tests ───────────────────────────────────────────────

const USER_ID = 'user-id-stub';
const PAGINATION = { page: 1, limit: 10 };

describe('FindBookingsByUserUseCase', () => {
  let sut: FindBookingsByUserUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindBookingsByUserUseCase(mocks.bookingRepository);
  });

  // ── req 4: usuário visualiza apenas suas próprias inscrições ─────────────
  describe('happy path', () => {
    it('should return paginated bookings for the given user', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(USER_ID, PAGINATION);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should call repository.findByUserId with the exact userId (req 4 — somente as próprias)', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(USER_ID, PAGINATION);

      // Assert
      expect(mocks.bookingRepository.findByUserIdWithTrip).toHaveBeenCalledWith(
        USER_ID,
        PAGINATION,
        undefined,
      );
      expect(
        mocks.bookingRepository.findByUserIdWithTrip,
      ).toHaveBeenCalledTimes(1);
    });

    it('should return bookings enriched with trip status and departure time', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(USER_ID, PAGINATION);

      // Assert
      expect(result.data[0].booking).toHaveProperty('id');
      expect(result.data[0].booking).toHaveProperty('userId');
      expect(result.data[0].booking).toHaveProperty('status');
      expect(result.data[0]).toHaveProperty('tripStatus');
      expect(result.data[0]).toHaveProperty('tripDepartureTime');
    });

    it('should NOT expose other users bookings — only userId is queried', async () => {
      // Arrange
      const otherUserId = 'other-user-id';
      const otherUserBookings = [makeBooking({ userId: otherUserId })];
      mocks.bookingRepository.findByUserIdWithTrip.mockResolvedValue(
        makePaginatedResponse(otherUserBookings),
      );

      // Act
      await sut.execute(otherUserId, PAGINATION);

      // Assert — repo is called with the other user's id, never mixing ids
      expect(mocks.bookingRepository.findByUserIdWithTrip).toHaveBeenCalledWith(
        otherUserId,
        PAGINATION,
        undefined,
      );
      expect(
        mocks.bookingRepository.findByUserIdWithTrip,
      ).not.toHaveBeenCalledWith(USER_ID, expect.anything(), expect.anything());
    });

    it('should return empty list when user has no bookings', async () => {
      // Arrange
      mocks.bookingRepository.findByUserIdWithTrip.mockResolvedValue(
        makePaginatedResponse([]),
      );

      // Act
      const result = await sut.execute(USER_ID, PAGINATION);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('filter -- status', () => {
    it('should pass status ACTIVE to repository when provided', async () => {
      setupHappyPath(mocks);
      await sut.execute(USER_ID, PAGINATION, 'ACTIVE');
      expect(mocks.bookingRepository.findByUserIdWithTrip).toHaveBeenCalledWith(
        USER_ID,
        PAGINATION,
        'ACTIVE',
      );
    });

    it('should pass status INACTIVE to repository when provided', async () => {
      setupHappyPath(mocks);
      await sut.execute(USER_ID, PAGINATION, 'INACTIVE');
      expect(mocks.bookingRepository.findByUserIdWithTrip).toHaveBeenCalledWith(
        USER_ID,
        PAGINATION,
        'INACTIVE',
      );
    });

    it('should pass undefined to repository when no status is provided', async () => {
      setupHappyPath(mocks);
      await sut.execute(USER_ID, PAGINATION);
      expect(mocks.bookingRepository.findByUserIdWithTrip).toHaveBeenCalledWith(
        USER_ID,
        PAGINATION,
        undefined,
      );
    });
  });
});
