import { CancelBookingUseCase } from 'src/modules/bookings/application/use-cases/cancel-booking.use-case';
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
    update: jest.fn(),
  } as any as jest.Mocked<BookingRepository>;

  return { bookingRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const booking = makeBooking({ organizationId: ORG_ID, status: 'ACTIVE' });

  mocks.bookingRepository.findById.mockResolvedValue(booking);
  mocks.bookingRepository.update.mockImplementation(async (entity) => entity);

  return { booking };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const BOOKING_ID = 'booking-id-stub';

describe('CancelBookingUseCase', () => {
  let sut: CancelBookingUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CancelBookingUseCase(mocks.bookingRepository);
  });

  // ── req 6, 7: usuário pode cancelar e status deve mudar ──────────────────
  describe('happy path', () => {
    it('should cancel the booking and return updated response', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(BOOKING_ID, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('INACTIVE');
    });

    it('should call repository.update exactly once', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(BOOKING_ID, ORG_ID);

      // Assert
      expect(mocks.bookingRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should persist entity with status INACTIVE', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(BOOKING_ID, ORG_ID);

      // Assert
      const updated = mocks.bookingRepository.update.mock.calls[0][0];
      expect(updated.status).toBe('INACTIVE');
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

    it('should NOT call update when booking is not found', async () => {
      // Arrange
      mocks.bookingRepository.findById.mockResolvedValue(null);

      // Act
      await expect(sut.execute(BOOKING_ID, ORG_ID)).rejects.toThrow(
        BookingNotFoundError,
      );

      // Assert
      expect(mocks.bookingRepository.update).not.toHaveBeenCalled();
    });
  });

  // ── segurança: req 7 — não cancela booking de outra org ─────────────────
  describe('error — cross-org access', () => {
    it('should throw BookingAccessForbiddenError when booking belongs to another org', async () => {
      // Arrange
      const booking = makeBooking({ organizationId: 'other-org' });
      mocks.bookingRepository.findById.mockResolvedValue(booking);

      // Act & Assert
      await expect(sut.execute(BOOKING_ID, ORG_ID)).rejects.toThrow(
        BookingAccessForbiddenError,
      );
    });

    it('should NOT call update when org differs (security: vaga não liberada indevidamente)', async () => {
      // Arrange
      const booking = makeBooking({ organizationId: 'other-org' });
      mocks.bookingRepository.findById.mockResolvedValue(booking);

      // Act
      await expect(sut.execute(BOOKING_ID, ORG_ID)).rejects.toThrow(
        BookingAccessForbiddenError,
      );

      // Assert
      expect(mocks.bookingRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — update returns null', () => {
    it('should throw BookingNotFoundError when update returns null', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.bookingRepository.update.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(BOOKING_ID, ORG_ID)).rejects.toThrow(
        BookingNotFoundError,
      );
    });
  });
});
