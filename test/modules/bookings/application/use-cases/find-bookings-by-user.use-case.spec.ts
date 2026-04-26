import { FindBookingsByUserUseCase } from 'src/modules/bookings/application/use-cases/find-bookings-by-user.use-case';
import { BookingRepository } from 'src/modules/bookings/domain/interfaces/booking.repository';
import { Booking } from 'src/modules/bookings/domain/entities';
import { PaginatedResponse } from 'src/shared/domain/interfaces';
import { makeBooking } from '../../factories/booking.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const bookingRepository = {
    findByUserId: jest.fn(),
  } as any as jest.Mocked<BookingRepository>;

  return { bookingRepository };
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
  const bookings = [
    makeBooking({ userId: USER_ID }),
    makeBooking({ userId: USER_ID }),
  ];
  const paginated = makePaginatedResponse(bookings);

  mocks.bookingRepository.findByUserId.mockResolvedValue(paginated);

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
      expect(mocks.bookingRepository.findByUserId).toHaveBeenCalledWith(
        USER_ID,
        PAGINATION,
        undefined,
      );
      expect(mocks.bookingRepository.findByUserId).toHaveBeenCalledTimes(1);
    });

    it('should map entities to response dtos', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(USER_ID, PAGINATION);

      // Assert
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('userId');
      expect(result.data[0]).toHaveProperty('status');
    });

    it('should NOT expose other users bookings — only userId is queried', async () => {
      // Arrange
      const otherUserId = 'other-user-id';
      const otherUserBookings = [makeBooking({ userId: otherUserId })];
      mocks.bookingRepository.findByUserId.mockResolvedValue(
        makePaginatedResponse(otherUserBookings),
      );

      // Act
      await sut.execute(otherUserId, PAGINATION);

      // Assert — repo is called with the other user's id, never mixing ids
      expect(mocks.bookingRepository.findByUserId).toHaveBeenCalledWith(
        otherUserId,
        PAGINATION,
        undefined,
      );
      expect(mocks.bookingRepository.findByUserId).not.toHaveBeenCalledWith(
        USER_ID,
        expect.anything(),
        expect.anything(),
      );
    });

    it('should return empty list when user has no bookings', async () => {
      // Arrange
      mocks.bookingRepository.findByUserId.mockResolvedValue(
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
      expect(mocks.bookingRepository.findByUserId).toHaveBeenCalledWith(
        USER_ID,
        PAGINATION,
        'ACTIVE',
      );
    });

    it('should pass status INACTIVE to repository when provided', async () => {
      setupHappyPath(mocks);
      await sut.execute(USER_ID, PAGINATION, 'INACTIVE');
      expect(mocks.bookingRepository.findByUserId).toHaveBeenCalledWith(
        USER_ID,
        PAGINATION,
        'INACTIVE',
      );
    });

    it('should pass undefined to repository when no status is provided', async () => {
      setupHappyPath(mocks);
      await sut.execute(USER_ID, PAGINATION);
      expect(mocks.bookingRepository.findByUserId).toHaveBeenCalledWith(
        USER_ID,
        PAGINATION,
        undefined,
      );
    });
  });
});
