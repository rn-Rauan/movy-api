import { FindBookingByIdUseCase } from 'src/modules/bookings/application/use-cases/find-booking-by-id.use-case';
import { BookingRepository } from 'src/modules/bookings/domain/interfaces/booking.repository';
import {
  BookingAccessForbiddenError,
  BookingNotFoundError,
} from 'src/modules/bookings/domain/entities/errors/booking.errors';
import { makeBooking } from '../../factories/booking.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const bookingRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<BookingRepository>;

  return { bookingRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const booking = makeBooking({
    id: BOOKING_ID,
    organizationId: ORG_ID,
    userId: USER_ID,
  });

  mocks.bookingRepository.findById.mockResolvedValue(booking);

  return { booking };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const USER_ID = 'user-id-stub';
const BOOKING_ID = 'booking-id-stub';

describe('FindBookingByIdUseCase', () => {
  let sut: FindBookingByIdUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindBookingByIdUseCase(mocks.bookingRepository);
  });

  // ── req 4: usuário visualiza suas inscrições ─────────────────────────────
  describe('happy path', () => {
    it('should return booking response dto when found and org matches', async () => {
      // Arrange
      const { booking } = setupHappyPath(mocks);

      // Act
      const result = await sut.execute(BOOKING_ID, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(booking.id);
      expect(result.userId).toBe(USER_ID);
      expect(result.organizationId).toBe(ORG_ID);
    });

    it('should call repository.findById with the provided id', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(BOOKING_ID, ORG_ID);

      // Assert
      expect(mocks.bookingRepository.findById).toHaveBeenCalledWith(BOOKING_ID);
      expect(mocks.bookingRepository.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('error — booking not found', () => {
    it('should throw BookingNotFoundError when booking does not exist', async () => {
      // Arrange
      mocks.bookingRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(BOOKING_ID, ORG_ID)).rejects.toThrow(
        BookingNotFoundError,
      );
    });
  });

  // ── req 5: não pode acessar inscrições de outros usuários ────────────────
  describe('error — cross-org access (req 5 — isolamento por organização)', () => {
    it('should throw BookingAccessForbiddenError when booking belongs to another org', async () => {
      // Arrange
      const booking = makeBooking({ organizationId: 'other-org' });
      mocks.bookingRepository.findById.mockResolvedValue(booking);

      // Act & Assert
      await expect(sut.execute(BOOKING_ID, ORG_ID)).rejects.toThrow(
        BookingAccessForbiddenError,
      );
    });

    it('should NOT expose booking data when org differs (throw before return)', async () => {
      // Arrange
      const foreignBooking = makeBooking({
        organizationId: 'other-org',
        userId: 'another-user-id',
      });
      mocks.bookingRepository.findById.mockResolvedValue(foreignBooking);

      // Act
      const call = sut.execute(BOOKING_ID, ORG_ID);

      // Assert
      await expect(call).rejects.toThrow(BookingAccessForbiddenError);
    });
  });
});
