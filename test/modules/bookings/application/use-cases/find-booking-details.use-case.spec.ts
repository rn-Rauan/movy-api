import { FindBookingDetailsUseCase } from 'src/modules/bookings/application/use-cases/find-booking-details.use-case';
import { BookingRepository } from 'src/modules/bookings/domain/interfaces/booking.repository';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import {
  BookingAccessForbiddenError,
  BookingNotFoundError,
} from 'src/modules/bookings/domain/entities/errors/booking.errors';
import { TripInstanceNotFoundError } from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { makeBooking } from '../../factories/booking.factory';
import { makeTripInstance } from 'test/modules/trip/factories/trip-instance.factory';

function makeMocks() {
  const bookingRepository = {
    findById: jest.fn(),
    countActiveByTripInstance: jest.fn(),
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
    tripInstanceId: BOOKING_ID + '-trip',
  });
  const instance = makeTripInstance({
    id: BOOKING_ID + '-trip',
    organizationId: ORG_ID,
    totalCapacity: 10,
    tripStatus: TripStatus.SCHEDULED,
  });
  mocks.bookingRepository.findById.mockResolvedValue(booking);
  mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
  mocks.bookingRepository.countActiveByTripInstance.mockResolvedValue(3);
  return { booking, instance };
}

const ORG_ID = 'org-id-stub';
const USER_ID = 'user-id-stub';
const BOOKING_ID = 'booking-id-stub';

describe('FindBookingDetailsUseCase', () => {
  let sut: FindBookingDetailsUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindBookingDetailsUseCase(
      mocks.bookingRepository,
      mocks.tripInstanceRepository,
    );
  });

  describe('happy path -- owner access', () => {
    it('should return booking with trip details', async () => {
      setupHappyPath(mocks);
      const result = await sut.execute(BOOKING_ID, USER_ID);
      expect(result).toBeDefined();
      expect(result.tripDepartureTime).toBeInstanceOf(Date);
      expect(result.availableSlots).toBe(7); // 10 - 3
      expect(result.totalCapacity).toBe(10);
    });

    it('should calculate availableSlots as totalCapacity minus activeCount', async () => {
      setupHappyPath(mocks);
      mocks.bookingRepository.countActiveByTripInstance.mockResolvedValue(8);
      const result = await sut.execute(BOOKING_ID, USER_ID);
      expect(result.availableSlots).toBe(2);
    });

    it('should cap availableSlots at 0 when count exceeds capacity', async () => {
      setupHappyPath(mocks);
      mocks.bookingRepository.countActiveByTripInstance.mockResolvedValue(12);
      const result = await sut.execute(BOOKING_ID, USER_ID);
      expect(result.availableSlots).toBe(0);
    });

    it('should include tripStatus in response', async () => {
      setupHappyPath(mocks);
      const result = await sut.execute(BOOKING_ID, USER_ID);
      expect(result.tripStatus).toBe(TripStatus.SCHEDULED);
    });
  });

  describe('happy path -- org member access', () => {
    it('should allow org member to access booking details', async () => {
      setupHappyPath(mocks);
      const result = await sut.execute(BOOKING_ID, 'other-user', ORG_ID);
      expect(result).toBeDefined();
      expect(result.availableSlots).toBe(7);
    });
  });

  describe('error -- booking not found', () => {
    it('should throw BookingNotFoundError', async () => {
      mocks.bookingRepository.findById.mockResolvedValue(null);
      await expect(sut.execute(BOOKING_ID, USER_ID)).rejects.toThrow(
        BookingNotFoundError,
      );
    });

    it('should NOT call tripInstanceRepository when booking is not found', async () => {
      mocks.bookingRepository.findById.mockResolvedValue(null);
      await expect(sut.execute(BOOKING_ID, USER_ID)).rejects.toThrow(
        BookingNotFoundError,
      );
      expect(mocks.tripInstanceRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('error -- access forbidden', () => {
    it('should throw BookingAccessForbiddenError when caller is neither owner nor org member', async () => {
      const booking = makeBooking({ organizationId: ORG_ID, userId: USER_ID });
      mocks.bookingRepository.findById.mockResolvedValue(booking);
      await expect(
        sut.execute(BOOKING_ID, 'other-user', 'other-org'),
      ).rejects.toThrow(BookingAccessForbiddenError);
    });

    it('should throw BookingAccessForbiddenError for anonymous org (B2C) calling other user booking', async () => {
      const booking = makeBooking({ organizationId: ORG_ID, userId: USER_ID });
      mocks.bookingRepository.findById.mockResolvedValue(booking);
      await expect(sut.execute(BOOKING_ID, 'other-user')).rejects.toThrow(
        BookingAccessForbiddenError,
      );
    });

    it('should NOT call tripInstanceRepository when access is forbidden', async () => {
      const booking = makeBooking({ organizationId: ORG_ID, userId: USER_ID });
      mocks.bookingRepository.findById.mockResolvedValue(booking);
      await expect(
        sut.execute(BOOKING_ID, 'other-user', 'other-org'),
      ).rejects.toThrow(BookingAccessForbiddenError);
      expect(mocks.tripInstanceRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('error -- trip instance not found', () => {
    it('should throw TripInstanceNotFoundError when trip instance no longer exists', async () => {
      const booking = makeBooking({ organizationId: ORG_ID, userId: USER_ID });
      mocks.bookingRepository.findById.mockResolvedValue(booking);
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);
      await expect(sut.execute(BOOKING_ID, USER_ID)).rejects.toThrow(
        TripInstanceNotFoundError,
      );
    });
  });
});
