import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import { FindTripInstancesByDriverMeUseCase } from 'src/modules/trip/application/use-cases/find-trip-instances-by-driver-me.use-case';
import {
  TripInstanceRepository,
  TripInstanceWithMeta,
} from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { TripStatus } from 'src/modules/trip/domain/interfaces/enums/trip-status.enum';
import { PaginatedResponse } from 'src/shared/domain/interfaces';
import { makeDriver } from '../../../driver/factories/driver.factory';
import { makeTripInstance } from '../../factories/trip-instance.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripInstanceRepository = {
    findByDriverIdWithMeta: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  const driverRepository = {
    findByUserId: jest.fn(),
  } as any as jest.Mocked<DriverRepository>;

  return { tripInstanceRepository, driverRepository };
}

function makeTripInstanceWithMeta(
  overrides: Partial<TripInstanceWithMeta> = {},
): TripInstanceWithMeta {
  return {
    instance: makeTripInstance(),
    bookedCount: 0,
    templateId: 'template-id-stub',
    departurePoint: 'Terminal Central',
    destination: 'Aeroporto',
    stops: ['Terminal Central', 'Praça', 'Aeroporto'],
    priceOneWay: null,
    priceReturn: null,
    priceRoundTrip: null,
    isRecurring: false,
    ...overrides,
  };
}

function makePaginatedResponse(
  items: TripInstanceWithMeta[],
): PaginatedResponse<TripInstanceWithMeta> {
  return {
    data: items,
    total: items.length,
    page: 1,
    limit: 10,
    totalPages: items.length === 0 ? 0 : 1,
  };
}

// ── Tests ───────────────────────────────────────────────

const USER_ID = 'user-id-stub';
const DRIVER_ID = 'driver-id-stub';
const PAGINATION = { page: 1, limit: 10 };

describe('FindTripInstancesByDriverMeUseCase', () => {
  let sut: FindTripInstancesByDriverMeUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindTripInstancesByDriverMeUseCase(
      mocks.tripInstanceRepository,
      mocks.driverRepository,
    );
  });

  describe('happy path', () => {
    it('should resolve driver from userId and return paginated trip instances', async () => {
      // Arrange
      const driver = makeDriver({ id: DRIVER_ID, userId: USER_ID });
      const items = [makeTripInstanceWithMeta(), makeTripInstanceWithMeta()];
      mocks.driverRepository.findByUserId.mockResolvedValue(driver);
      mocks.tripInstanceRepository.findByDriverIdWithMeta.mockResolvedValue(
        makePaginatedResponse(items),
      );

      // Act
      const result = await sut.execute(USER_ID, PAGINATION);

      // Assert
      expect(mocks.driverRepository.findByUserId).toHaveBeenCalledWith(USER_ID);
      expect(
        mocks.tripInstanceRepository.findByDriverIdWithMeta,
      ).toHaveBeenCalledWith(DRIVER_ID, PAGINATION, undefined);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should forward the status filter to the repository when provided', async () => {
      // Arrange
      const driver = makeDriver({ id: DRIVER_ID, userId: USER_ID });
      mocks.driverRepository.findByUserId.mockResolvedValue(driver);
      mocks.tripInstanceRepository.findByDriverIdWithMeta.mockResolvedValue(
        makePaginatedResponse([]),
      );

      // Act
      await sut.execute(USER_ID, PAGINATION, TripStatus.SCHEDULED);

      // Assert
      expect(
        mocks.tripInstanceRepository.findByDriverIdWithMeta,
      ).toHaveBeenCalledWith(DRIVER_ID, PAGINATION, TripStatus.SCHEDULED);
    });
  });

  describe('user has no driver profile yet', () => {
    it('should return an empty page without hitting the trip repository', async () => {
      // Arrange
      mocks.driverRepository.findByUserId.mockResolvedValue(null);

      // Act
      const result = await sut.execute(USER_ID, PAGINATION);

      // Assert
      expect(result).toEqual({
        data: [],
        total: 0,
        page: PAGINATION.page,
        limit: PAGINATION.limit,
        totalPages: 0,
      });
      expect(
        mocks.tripInstanceRepository.findByDriverIdWithMeta,
      ).not.toHaveBeenCalled();
    });
  });
});
