import { FindBookingsByOrganizationUseCase } from 'src/modules/bookings/application/use-cases/find-bookings-by-organization.use-case';
import { BookingRepository } from 'src/modules/bookings/domain/interfaces/booking.repository';
import { Booking } from 'src/modules/bookings/domain/entities';
import { PaginatedResponse } from 'src/shared/domain/interfaces';
import { makeBooking } from '../../factories/booking.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const bookingRepository = {
    findByOrganizationId: jest.fn(),
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
    makeBooking({ organizationId: ORG_ID }),
    makeBooking({ organizationId: ORG_ID }),
  ];
  const paginated = makePaginatedResponse(bookings);

  mocks.bookingRepository.findByOrganizationId.mockResolvedValue(paginated);

  return { bookings, paginated };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const PAGINATION = { page: 1, limit: 10 };

describe('FindBookingsByOrganizationUseCase', () => {
  let sut: FindBookingsByOrganizationUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindBookingsByOrganizationUseCase(mocks.bookingRepository);
  });

  // ── req 11: dono da viagem visualiza todos os inscritos ──────────────────
  describe('happy path', () => {
    it('should return paginated list of bookings for the organization', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(ORG_ID, PAGINATION);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should call repository.findByOrganizationId with correct args', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(ORG_ID, PAGINATION);

      // Assert
      expect(mocks.bookingRepository.findByOrganizationId).toHaveBeenCalledWith(
        ORG_ID,
        PAGINATION,
      );
      expect(
        mocks.bookingRepository.findByOrganizationId,
      ).toHaveBeenCalledTimes(1);
    });

    it('should map entities to response dtos', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(ORG_ID, PAGINATION);

      // Assert
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('userId');
      expect(result.data[0]).toHaveProperty('status');
    });

    it('should return empty list when organization has no bookings', async () => {
      // Arrange
      mocks.bookingRepository.findByOrganizationId.mockResolvedValue(
        makePaginatedResponse([]),
      );

      // Act
      const result = await sut.execute(ORG_ID, PAGINATION);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should preserve pagination metadata', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(ORG_ID, PAGINATION);

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });
  });
});
