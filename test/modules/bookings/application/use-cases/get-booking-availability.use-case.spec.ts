import { GetBookingAvailabilityUseCase } from 'src/modules/bookings/application/use-cases/get-booking-availability.use-case';
import {
  TripInstanceRepository,
  TripStatus,
} from 'src/modules/trip/domain/interfaces';
import { BookingRepository } from 'src/modules/bookings/domain/interfaces/booking.repository';
import { TripInstanceNotFoundError } from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { makeTripInstance } from 'test/modules/trip/factories/trip-instance.factory';

function makeMocks() {
  const tripInstanceRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;
  const bookingRepository = {
    countActiveByTripInstance: jest.fn(),
  } as any as jest.Mocked<BookingRepository>;
  return { tripInstanceRepository, bookingRepository };
}

function setupHappyPath(
  mocks: ReturnType<typeof makeMocks>,
  capacity = 10,
  activeCount = 3,
) {
  const instance = makeTripInstance({
    tripStatus: TripStatus.SCHEDULED,
    totalCapacity: capacity,
  });
  mocks.tripInstanceRepository.findById.mockResolvedValue(instance);
  mocks.bookingRepository.countActiveByTripInstance.mockResolvedValue(
    activeCount,
  );
  return { instance };
}

const TRIP_INSTANCE_ID = 'trip-instance-id-stub';

describe('GetBookingAvailabilityUseCase', () => {
  let sut: GetBookingAvailabilityUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new GetBookingAvailabilityUseCase(
      mocks.tripInstanceRepository,
      mocks.bookingRepository,
    );
  });

  describe('happy path', () => {
    it('should return correct slot counts for SCHEDULED trip', async () => {
      setupHappyPath(mocks, 10, 3);
      const result = await sut.execute(TRIP_INSTANCE_ID);
      expect(result.availableSlots).toBe(7);
      expect(result.activeCount).toBe(3);
      expect(result.totalCapacity).toBe(10);
      expect(result.isBookable).toBe(true);
    });

    it('should return isBookable = true for CONFIRMED with slots available', async () => {
      mocks.tripInstanceRepository.findById.mockResolvedValue(
        makeTripInstance({
          tripStatus: TripStatus.CONFIRMED,
          totalCapacity: 20,
        }),
      );
      mocks.bookingRepository.countActiveByTripInstance.mockResolvedValue(5);
      const result = await sut.execute(TRIP_INSTANCE_ID);
      expect(result.isBookable).toBe(true);
    });

    it('should return isBookable = false when trip is DRAFT', async () => {
      mocks.tripInstanceRepository.findById.mockResolvedValue(
        makeTripInstance({ tripStatus: TripStatus.DRAFT, totalCapacity: 10 }),
      );
      mocks.bookingRepository.countActiveByTripInstance.mockResolvedValue(0);
      const result = await sut.execute(TRIP_INSTANCE_ID);
      expect(result.isBookable).toBe(false);
    });

    it('should return isBookable = false when trip is IN_PROGRESS', async () => {
      mocks.tripInstanceRepository.findById.mockResolvedValue(
        makeTripInstance({
          tripStatus: TripStatus.IN_PROGRESS,
          totalCapacity: 10,
        }),
      );
      mocks.bookingRepository.countActiveByTripInstance.mockResolvedValue(0);
      const result = await sut.execute(TRIP_INSTANCE_ID);
      expect(result.isBookable).toBe(false);
    });

    it('should return isBookable = false when CONFIRMED but full', async () => {
      mocks.tripInstanceRepository.findById.mockResolvedValue(
        makeTripInstance({
          tripStatus: TripStatus.CONFIRMED,
          totalCapacity: 5,
        }),
      );
      mocks.bookingRepository.countActiveByTripInstance.mockResolvedValue(5);
      const result = await sut.execute(TRIP_INSTANCE_ID);
      expect(result.isBookable).toBe(false);
      expect(result.availableSlots).toBe(0);
    });

    it('should cap availableSlots at 0 when count exceeds capacity', async () => {
      setupHappyPath(mocks, 10, 15);
      const result = await sut.execute(TRIP_INSTANCE_ID);
      expect(result.availableSlots).toBe(0);
    });

    it('should return the tripInstanceId in the response', async () => {
      setupHappyPath(mocks);
      const result = await sut.execute(TRIP_INSTANCE_ID);
      expect(result.tripInstanceId).toBe(TRIP_INSTANCE_ID);
    });
  });

  describe('error -- trip not found', () => {
    it('should throw TripInstanceNotFoundError', async () => {
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);
      await expect(sut.execute(TRIP_INSTANCE_ID)).rejects.toThrow(
        TripInstanceNotFoundError,
      );
    });

    it('should NOT call countActiveByTripInstance when trip is not found', async () => {
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);
      await expect(sut.execute(TRIP_INSTANCE_ID)).rejects.toThrow(
        TripInstanceNotFoundError,
      );
      expect(
        mocks.bookingRepository.countActiveByTripInstance,
      ).not.toHaveBeenCalled();
    });
  });
});
