import { CreateBookingUseCase } from 'src/modules/bookings/application/use-cases/create-booking.use-case';
import { BookingRepository } from 'src/modules/bookings/domain/interfaces/booking.repository';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import {
  BookingAlreadyExistsError,
  BookingCreationFailedError,
  TripInstanceNotBookableError,
} from 'src/modules/bookings/domain/entities/errors/booking.errors';
import { makeBooking } from '../../factories/booking.factory';
import { makeCreateBookingDto } from '../../factories/create-booking.dto.factory';
import { makeTripInstance } from 'test/modules/trip/factories/trip-instance.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const bookingRepository = {
    save: jest.fn(),
    findByUserAndTripInstance: jest.fn(),
  } as any as jest.Mocked<BookingRepository>;

  const tripInstanceRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  return { bookingRepository, tripInstanceRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const instance = makeTripInstance({
    organizationId: ORG_ID,
    tripStatus: TripStatus.SCHEDULED,
  });
  const booking = makeBooking({ organizationId: ORG_ID, userId: USER_ID });

  mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
  mocks.bookingRepository.findByUserAndTripInstance.mockResolvedValue(null);
  mocks.bookingRepository.save.mockImplementation(async (entity) => entity);

  return { instance, booking };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const USER_ID = 'user-id-stub';

describe('CreateBookingUseCase', () => {
  let sut: CreateBookingUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CreateBookingUseCase(
      mocks.bookingRepository,
      mocks.tripInstanceRepository,
    );
  });

  // ── req 2: pode se inscrever em SCHEDULED ou CONFIRMED ──────────────────
  describe('happy path — trip SCHEDULED', () => {
    it('should create booking and return response dto', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateBookingDto();

      // Act
      const result = await sut.execute(dto, USER_ID, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(USER_ID);
      expect(result.organizationId).toBe(ORG_ID);
      expect(result.tripInstanceId).toBe(dto.tripInstanceId);
    });

    it('should call repository.save exactly once', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID);

      // Assert
      expect(mocks.bookingRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should persist booking with correct userId and organizationId — never from body', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID);

      // Assert
      const saved = mocks.bookingRepository.save.mock.calls[0][0];
      expect(saved.userId).toBe(USER_ID);
      expect(saved.organizationId).toBe(ORG_ID);
    });
  });

  describe('happy path — trip CONFIRMED', () => {
    it('should create booking when trip status is CONFIRMED', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: ORG_ID,
        tripStatus: TripStatus.CONFIRMED,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
      mocks.bookingRepository.findByUserAndTripInstance.mockResolvedValue(null);
      mocks.bookingRepository.save.mockImplementation(async (entity) => entity);

      // Act
      const result = await sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(mocks.bookingRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  // ── req 8: pode se reinscrever após cancelamento ────────────────────────
  describe('happy path — re-enrollment after cancellation', () => {
    it('should allow re-enrollment when previous booking was cancelled (findByUserAndTripInstance returns null)', async () => {
      // Arrange
      // Cancelled booking is filtered out by the repo (status: ACTIVE only),
      // so findByUserAndTripInstance returns null → no duplicate block
      setupHappyPath(mocks); // already mocks null

      // Act
      const result = await sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(mocks.bookingRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  // ── req 3: não pode se inscrever em trip não bookável ───────────────────
  describe('error — trip not bookable (DRAFT)', () => {
    it('should throw TripInstanceNotBookableError when trip is DRAFT', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: ORG_ID,
        tripStatus: TripStatus.DRAFT,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceNotBookableError);
    });

    it('should NOT call save when trip is DRAFT', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: ORG_ID,
        tripStatus: TripStatus.DRAFT,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceNotBookableError);

      // Assert
      expect(mocks.bookingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error — trip not bookable (CANCELED)', () => {
    it('should throw TripInstanceNotBookableError when trip is CANCELED', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: ORG_ID,
        tripStatus: TripStatus.CANCELED,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceNotBookableError);
    });
  });

  describe('error — trip not bookable (IN_PROGRESS)', () => {
    it('should throw TripInstanceNotBookableError when trip is IN_PROGRESS', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: ORG_ID,
        tripStatus: TripStatus.IN_PROGRESS,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceNotBookableError);
    });
  });

  // ── req 3a / req 9: impede inscrição duplicada ──────────────────────────
  describe('error — duplicate active booking', () => {
    it('should throw BookingAlreadyExistsError when user already has active booking', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.bookingRepository.findByUserAndTripInstance.mockResolvedValue(
        makeBooking({ userId: USER_ID, organizationId: ORG_ID }),
      );

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID),
      ).rejects.toThrow(BookingAlreadyExistsError);
    });

    it('should NOT call save when duplicate booking exists (overbooking prevention)', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.bookingRepository.findByUserAndTripInstance.mockResolvedValue(
        makeBooking({ userId: USER_ID }),
      );

      // Act
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID),
      ).rejects.toThrow(BookingAlreadyExistsError);

      // Assert
      expect(mocks.bookingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error — trip instance not found', () => {
    it('should throw TripInstanceNotFoundError when trip does not exist', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);
    });

    it('should NOT call booking checks when trip not found', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);

      // Assert
      expect(
        mocks.bookingRepository.findByUserAndTripInstance,
      ).not.toHaveBeenCalled();
      expect(mocks.bookingRepository.save).not.toHaveBeenCalled();
    });
  });

  // ── segurança: isolamento por organização ───────────────────────────────
  describe('error — cross-org trip access', () => {
    it('should throw TripInstanceAccessForbiddenError when trip belongs to another org', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: 'other-org',
        tripStatus: TripStatus.SCHEDULED,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceAccessForbiddenError);
    });

    it('should NOT proceed to duplicate check when trip is from another org', async () => {
      // Arrange
      const instance = makeTripInstance({ organizationId: 'other-org' });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID),
      ).rejects.toThrow(TripInstanceAccessForbiddenError);

      // Assert
      expect(
        mocks.bookingRepository.findByUserAndTripInstance,
      ).not.toHaveBeenCalled();
    });
  });

  describe('error — persistence failure', () => {
    it('should throw BookingCreationFailedError when save returns null', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.bookingRepository.save.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID, ORG_ID),
      ).rejects.toThrow(BookingCreationFailedError);
    });
  });
});
