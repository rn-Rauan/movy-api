import { CancelBookingUseCase } from 'src/modules/bookings/application/use-cases/cancel-booking.use-case';
import { BookingRepository } from 'src/modules/bookings/domain/interfaces/booking.repository';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import {
  BookingAccessForbiddenError,
  BookingAlreadyInactiveError,
  BookingCancellationDeadlineError,
  BookingCancellationNotAllowedError,
  BookingNotFoundError,
} from 'src/modules/bookings/domain/entities/errors/booking.errors';
import { makeBooking } from '../../factories/booking.factory';
import { makeTripInstance } from 'test/modules/trip/factories/trip-instance.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const bookingRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  } as any as jest.Mocked<BookingRepository>;

  const tripInstanceRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  return { bookingRepository, tripInstanceRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const booking = makeBooking({
    organizationId: ORG_ID,
    userId: USER_ID,
    status: 'ACTIVE',
  });
  // Departure in 2 hours
  const departure = new Date();
  departure.setHours(departure.getHours() + 2);

  const instance = makeTripInstance({
    tripStatus: TripStatus.SCHEDULED,
    departureTime: departure,
  });

  mocks.bookingRepository.findById.mockResolvedValue(booking);
  mocks.bookingRepository.update.mockImplementation(async (entity) => entity);
  mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

  return { booking, instance };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const USER_ID = 'user-id-stub';
const BOOKING_ID = 'booking-id-stub';

describe('CancelBookingUseCase', () => {
  let sut: CancelBookingUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CancelBookingUseCase(
      mocks.bookingRepository,
      mocks.tripInstanceRepository,
    );
  });

  // ── req 6, 7: usuário pode cancelar e status deve mudar ──────────────────
  describe('happy path', () => {
    it('should cancel the booking and return updated response', async () => {
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

    it('should persist entity with status INACTIVE', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(BOOKING_ID, USER_ID, ORG_ID);

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
      await expect(sut.execute(BOOKING_ID, USER_ID)).rejects.toThrow(
        BookingNotFoundError,
      );
    });

    it('should NOT call update when booking is not found', async () => {
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

  // ── segurança: req 7 — não cancela booking de outra org ─────────────────
  describe('error — cross-org access', () => {
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

    it('should NOT call update when org differs (security: vaga não liberada indevidamente)', async () => {
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

  describe('error — booking already inactive', () => {
    it('should throw BookingAlreadyInactiveError when booking is already INACTIVE', async () => {
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

  describe('error — cancellation deadline passed', () => {
    it('should throw BookingCancellationDeadlineError when departure is in less than 30 minutes', async () => {
      // Arrange
      const booking = makeBooking({
        organizationId: ORG_ID,
        userId: USER_ID,
        status: 'ACTIVE',
      });
      // Departure in 20 minutes
      const departure = new Date();
      departure.setMinutes(departure.getMinutes() + 20);

      const instance = makeTripInstance({
        tripStatus: TripStatus.SCHEDULED,
        departureTime: departure,
      });

      mocks.bookingRepository.findById.mockResolvedValue(booking);
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(sut.execute(BOOKING_ID, USER_ID, ORG_ID)).rejects.toThrow(
        BookingCancellationDeadlineError,
      );
    });
  });

  describe('error — update returns null', () => {
    it('should throw BookingNotFoundError when update returns null', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.bookingRepository.update.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(BOOKING_ID, USER_ID, ORG_ID)).rejects.toThrow(
        BookingNotFoundError,
      );
    });
  });

  // ── req 10: cancelamento bloqueado em trip ativa ou finalizada ───────────
  describe('error — cancellation not allowed (trip IN_PROGRESS)', () => {
    it('should throw BookingCancellationNotAllowedError when trip is IN_PROGRESS', async () => {
      // Arrange
      const booking = makeBooking({
        organizationId: ORG_ID,
        userId: USER_ID,
        status: 'ACTIVE',
      });
      const instance = makeTripInstance({ tripStatus: TripStatus.IN_PROGRESS });
      mocks.bookingRepository.findById.mockResolvedValue(booking);
      mocks.bookingRepository.update.mockImplementation(
        async (entity) => entity,
      );
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(sut.execute(BOOKING_ID, USER_ID, ORG_ID)).rejects.toThrow(
        BookingCancellationNotAllowedError,
      );
    });

    it('should NOT call update when trip is IN_PROGRESS', async () => {
      // Arrange
      const booking = makeBooking({
        organizationId: ORG_ID,
        userId: USER_ID,
        status: 'ACTIVE',
      });
      const instance = makeTripInstance({ tripStatus: TripStatus.IN_PROGRESS });
      mocks.bookingRepository.findById.mockResolvedValue(booking);
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act
      await expect(sut.execute(BOOKING_ID, USER_ID, ORG_ID)).rejects.toThrow(
        BookingCancellationNotAllowedError,
      );

      // Assert
      expect(mocks.bookingRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — cancellation not allowed (trip FINISHED)', () => {
    it('should throw BookingCancellationNotAllowedError when trip is FINISHED', async () => {
      // Arrange
      const booking = makeBooking({
        organizationId: ORG_ID,
        userId: USER_ID,
        status: 'ACTIVE',
      });
      const instance = makeTripInstance({ tripStatus: TripStatus.FINISHED });
      mocks.bookingRepository.findById.mockResolvedValue(booking);
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(sut.execute(BOOKING_ID, USER_ID, ORG_ID)).rejects.toThrow(
        BookingCancellationNotAllowedError,
      );
    });
  });
});
