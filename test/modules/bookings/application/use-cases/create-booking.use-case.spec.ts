import { CreateBookingUseCase } from 'src/modules/bookings/application/use-cases/create-booking.use-case';
import { BookingRepository } from 'src/modules/bookings/domain/interfaces/booking.repository';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { TripTemplateRepository } from 'src/modules/trip/domain/interfaces/trip-template.repository';
import { PaymentRepository } from 'src/modules/payment/domain/interfaces/payment.repository';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import { TripInstanceNotFoundError } from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import {
  BookingAlreadyExistsError,
  BookingCreationFailedError,
  TripInstanceFullError,
  TripInstanceNotBookableError,
  TripPriceNotAvailableError,
} from 'src/modules/bookings/domain/entities/errors/booking.errors';
import { makeBooking } from '../../factories/booking.factory';
import { makeCreateBookingDto } from '../../factories/create-booking.dto.factory';
import { makeTripInstance } from 'test/modules/trip/factories/trip-instance.factory';
import { makeTripTemplate } from 'test/modules/trip/factories/trip-template.factory';

function makeMocks() {
  const bookingRepository = {
    save: jest.fn(),
    findByUserAndTripInstance: jest.fn(),
    countActiveByTripInstance: jest.fn(),
  } as any as jest.Mocked<BookingRepository>;

  const tripInstanceRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  const tripTemplateRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<TripTemplateRepository>;

  const paymentRepository = {
    save: jest.fn(),
  } as any as jest.Mocked<PaymentRepository>;

  const transactionManager = {
    runInTransaction: jest.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
  };

  return {
    bookingRepository,
    tripInstanceRepository,
    tripTemplateRepository,
    paymentRepository,
    transactionManager,
  };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const instance = makeTripInstance({
    organizationId: ORG_ID,
    tripStatus: TripStatus.SCHEDULED,
    totalCapacity: 10,
  });
  const booking = makeBooking({ organizationId: ORG_ID, userId: USER_ID });
  const template = makeTripTemplate({
    organizationId: ORG_ID,
    priceOneWay: 49.9,
  });

  mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
  mocks.bookingRepository.countActiveByTripInstance.mockResolvedValue(0);
  mocks.bookingRepository.findByUserAndTripInstance.mockResolvedValue(null);
  mocks.tripTemplateRepository.findById.mockResolvedValue(template);
  mocks.bookingRepository.save.mockImplementation(async (entity) => entity);

  mocks.paymentRepository.save.mockImplementation(async (entity) => entity);

  return { instance, booking, template };
}

const ORG_ID = 'org-id-stub';
const USER_ID = 'user-id-stub';

describe('CreateBookingUseCase', () => {
  let sut: CreateBookingUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CreateBookingUseCase(
      mocks.bookingRepository,
      mocks.paymentRepository,
      mocks.tripInstanceRepository,
      mocks.tripTemplateRepository,
      mocks.transactionManager,
    );
  });

  describe('happy path â€” trip SCHEDULED', () => {
    it('should create booking and return response dto', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateBookingDto();

      // Act
      const result = await sut.execute(dto, USER_ID);

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
      await sut.execute(makeCreateBookingDto(), USER_ID);

      // Assert
      expect(mocks.bookingRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should persist booking with correct userId and organizationId â€” never from body', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(makeCreateBookingDto(), USER_ID);

      // Assert
      const saved = mocks.bookingRepository.save.mock.calls[0][0];
      expect(saved.userId).toBe(USER_ID);
      expect(saved.organizationId).toBe(ORG_ID);
    });
  });

  describe('happy path â€” trip CONFIRMED', () => {
    it('should create booking when trip status is CONFIRMED', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: ORG_ID,
        tripStatus: TripStatus.CONFIRMED,
        totalCapacity: 10,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
      mocks.bookingRepository.countActiveByTripInstance.mockResolvedValue(0);
      mocks.bookingRepository.findByUserAndTripInstance.mockResolvedValue(null);
      mocks.tripTemplateRepository.findById.mockResolvedValue(
        makeTripTemplate({ organizationId: ORG_ID, priceOneWay: 49.9 }),
      );
      mocks.bookingRepository.save.mockImplementation(async (entity) => entity);
      mocks.paymentRepository.save.mockImplementation(async (entity) => entity);
      // Act
      const result = await sut.execute(makeCreateBookingDto(), USER_ID);

      // Assert
      expect(result).toBeDefined();
      expect(mocks.bookingRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('happy path â€” re-enrollment after cancellation', () => {
    it('should allow re-enrollment when previous booking was cancelled (findByUserAndTripInstance returns null)', async () => {
      // Arrange
      // Cancelled booking is filtered out by the repo (status: ACTIVE only),
      // so findByUserAndTripInstance returns null â†’ no duplicate block
      setupHappyPath(mocks); // already mocks null

      // Act
      const result = await sut.execute(makeCreateBookingDto(), USER_ID);

      // Assert
      expect(result).toBeDefined();
      expect(mocks.bookingRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('error â€” trip not bookable (DRAFT)', () => {
    it('should throw TripInstanceNotBookableError when trip is DRAFT', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: ORG_ID,
        tripStatus: TripStatus.DRAFT,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID),
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
        sut.execute(makeCreateBookingDto(), USER_ID),
      ).rejects.toThrow(TripInstanceNotBookableError);

      // Assert
      expect(mocks.bookingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error â€” trip not bookable (CANCELED)', () => {
    it('should throw TripInstanceNotBookableError when trip is CANCELED', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: ORG_ID,
        tripStatus: TripStatus.CANCELED,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID),
      ).rejects.toThrow(TripInstanceNotBookableError);
    });
  });

  describe('error â€” trip not bookable (IN_PROGRESS)', () => {
    it('should throw TripInstanceNotBookableError when trip is IN_PROGRESS', async () => {
      // Arrange
      const instance = makeTripInstance({
        organizationId: ORG_ID,
        tripStatus: TripStatus.IN_PROGRESS,
      });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID),
      ).rejects.toThrow(TripInstanceNotBookableError);
    });
  });

  describe('error â€” duplicate active booking', () => {
    it('should throw BookingAlreadyExistsError when user already has active booking', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.bookingRepository.findByUserAndTripInstance.mockResolvedValue(
        makeBooking({ userId: USER_ID, organizationId: ORG_ID }),
      );

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID),
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
        sut.execute(makeCreateBookingDto(), USER_ID),
      ).rejects.toThrow(BookingAlreadyExistsError);

      // Assert
      expect(mocks.bookingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error â€” trip instance not found', () => {
    it('should throw TripInstanceNotFoundError when trip does not exist', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);
    });

    it('should NOT call booking checks when trip not found', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID),
      ).rejects.toThrow(TripInstanceNotFoundError);

      // Assert
      expect(
        mocks.bookingRepository.findByUserAndTripInstance,
      ).not.toHaveBeenCalled();
      expect(mocks.bookingRepository.save).not.toHaveBeenCalled();
    });
  });
  describe('error — persistence failure', () => {
    it('should throw BookingCreationFailedError when save returns null', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.bookingRepository.save.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID),
      ).rejects.toThrow(BookingCreationFailedError);
    });
  });

  // ── req 11: impede inscrição quando capacidade está esgotada ─────────────
  describe('error — trip instance full', () => {
    it('should throw TripInstanceFullError when active count equals totalCapacity', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.bookingRepository.countActiveByTripInstance.mockResolvedValue(10);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID),
      ).rejects.toThrow(TripInstanceFullError);
    });

    it('should NOT call save when trip instance is full', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.bookingRepository.countActiveByTripInstance.mockResolvedValue(10);

      // Act
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID),
      ).rejects.toThrow(TripInstanceFullError);

      // Assert
      expect(mocks.bookingRepository.save).not.toHaveBeenCalled();
    });
  });

  // ── req 12: preço resolvido server-side — falha se template sem preço ────
  describe('error — price not available', () => {
    it('should throw TripPriceNotAvailableError when template has no price for enrollmentType', async () => {
      // Arrange
      setupHappyPath(mocks);
      // Retornar null simula template não encontrado → preço indisponível
      mocks.tripTemplateRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID),
      ).rejects.toThrow(TripPriceNotAvailableError);
    });

    it('should NOT call save when price is not available', async () => {
      // Arrange
      setupHappyPath(mocks);
      mocks.tripTemplateRepository.findById.mockResolvedValue(null);

      // Act
      await expect(
        sut.execute(makeCreateBookingDto(), USER_ID),
      ).rejects.toThrow(TripPriceNotAvailableError);

      // Assert
      expect(mocks.bookingRepository.save).not.toHaveBeenCalled();
    });
  });
});
