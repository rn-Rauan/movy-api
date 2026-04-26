import { ConfirmPresenceUseCase } from 'src/modules/bookings/application/use-cases/confirm-presence.use-case';
import { BookingRepository } from 'src/modules/bookings/domain/interfaces/booking.repository';
import {
  BookingAccessForbiddenError,
  BookingAlreadyInactiveError,
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
  const booking = makeBooking({
    organizationId: ORG_ID,
    userId: USER_ID,
    presenceConfirmed: false,
  });

  mocks.bookingRepository.findById.mockResolvedValue(booking);
  mocks.bookingRepository.update.mockImplementation(async (entity) => entity);

  return { booking };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const USER_ID = 'user-id-stub';
const BOOKING_ID = 'booking-id-stub';

describe('ConfirmPresenceUseCase', () => {
  let sut: ConfirmPresenceUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new ConfirmPresenceUseCase(mocks.bookingRepository);
  });

  describe('happy path', () => {
    it('should confirm presence and return response with presenceConfirmed = true', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(BOOKING_ID, USER_ID, ORG_ID);
    });

    it('should call repository.update exactly once', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(BOOKING_ID, USER_ID, ORG_ID);

      // Assert
      expect(mocks.bookingRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should persist entity with presenceConfirmed = true', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(BOOKING_ID, USER_ID, ORG_ID);

      // Assert
      const updated = mocks.bookingRepository.update.mock.calls[0][0];
      expect(updated.presenceConfirmed).toBe(true);
    });
  });

  describe('error — booking not found', () => {
    it('should throw BookingNotFoundError when booking does not exist', async () => {
      // Arrange
      mocks.bookingRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(BOOKING_ID, USER_ID)).rejects.toThrow(
        BookingNotFoundError,
      );
    });

    it('should NOT call update when booking not found', async () => {
      // Arrange
      mocks.bookingRepository.findById.mockResolvedValue(null);

      // Act
      await expect(sut.execute(BOOKING_ID, USER_ID)).rejects.toThrow(
        BookingNotFoundError,
      );

      // Assert
      expect(mocks.bookingRepository.update).not.toHaveBeenCalled();
    });
  });

  // ── segurança: owner NÃO pode confirmar a própria presença ─────────────────
  describe('error — owner cannot confirm own presence', () => {
    it('should throw BookingAccessForbiddenError when caller is the owner but has no org access', async () => {
      // Arrange
      const booking = makeBooking({ organizationId: ORG_ID, userId: USER_ID });
      mocks.bookingRepository.findById.mockResolvedValue(booking);

      // Act & Assert — B2C user without organizationId
      await expect(sut.execute(BOOKING_ID, USER_ID)).rejects.toThrow(
        BookingAccessForbiddenError,
      );
    });

    it('should NOT call update when owner tries to confirm own presence', async () => {
      // Arrange
      const booking = makeBooking({ organizationId: ORG_ID, userId: USER_ID });
      mocks.bookingRepository.findById.mockResolvedValue(booking);

      // Act
      await expect(sut.execute(BOOKING_ID, USER_ID)).rejects.toThrow(
        BookingAccessForbiddenError,
      );

      // Assert
      expect(mocks.bookingRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — booking already inactive', () => {
    it('should throw BookingAlreadyInactiveError when booking is INACTIVE', async () => {
      // Arrange
      const booking = makeBooking({
        organizationId: ORG_ID,
        userId: USER_ID,
        status: 'INACTIVE',
      });
      mocks.bookingRepository.findById.mockResolvedValue(booking);

      // Act & Assert
      await expect(sut.execute(BOOKING_ID, USER_ID, ORG_ID)).rejects.toThrow(
        BookingAlreadyInactiveError,
      );
    });
  });

  describe('error — access forbidden', () => {
    it('should throw BookingAccessForbiddenError when booking belongs to another org and user is not the owner', async () => {
      // Arrange
      const booking = makeBooking({
        organizationId: 'other-org',
        userId: 'other-user',
      });
      mocks.bookingRepository.findById.mockResolvedValue(booking);

      // Act & Assert
      await expect(sut.execute(BOOKING_ID, USER_ID, ORG_ID)).rejects.toThrow(
        BookingAccessForbiddenError,
      );
    });

    it('should NOT call update when org differs', async () => {
      // Arrange
      const booking = makeBooking({
        organizationId: 'other-org',
        userId: 'other-user',
      });
      mocks.bookingRepository.findById.mockResolvedValue(booking);

      // Act
      await expect(sut.execute(BOOKING_ID, USER_ID, ORG_ID)).rejects.toThrow(
        BookingAccessForbiddenError,
      );

      // Assert
      expect(mocks.bookingRepository.update).not.toHaveBeenCalled();
    });
  });
});
