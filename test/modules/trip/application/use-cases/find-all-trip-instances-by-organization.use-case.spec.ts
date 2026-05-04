import { FindAllTripInstancesByOrganizationUseCase } from 'src/modules/trip/application/use-cases/find-all-trip-instances-by-organization.use-case';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { TripInstanceWithMeta } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { PaginatedResponse } from 'src/shared/domain/interfaces';
import { makeTripInstance } from '../../factories/trip-instance.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripInstanceRepository = {
    findByOrganizationIdWithMeta: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  return { tripInstanceRepository };
}

function makeTripInstanceWithMeta(
  overrides: Partial<TripInstanceWithMeta> = {},
): TripInstanceWithMeta {
  return {
    instance: makeTripInstance({ organizationId: ORG_ID }),
    bookedCount: 0,
    departurePoint: 'Terminal Central',
    destination: 'Aeroporto',
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
    totalPages: 1,
  };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const items = [makeTripInstanceWithMeta(), makeTripInstanceWithMeta()];
  const paginated = makePaginatedResponse(items);

  mocks.tripInstanceRepository.findByOrganizationIdWithMeta.mockResolvedValue(
    paginated,
  );

  return { items, paginated };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const PAGINATION = { page: 1, limit: 10 };

describe('FindAllTripInstancesByOrganizationUseCase', () => {
  let sut: FindAllTripInstancesByOrganizationUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindAllTripInstancesByOrganizationUseCase(
      mocks.tripInstanceRepository,
    );
  });

  describe('happy path', () => {
    it('should return paginated list of trip instances for the organization', async () => {
      // Arrange
      setupHappyPath(mocks);
      // Act
      const result = await sut.execute(ORG_ID, PAGINATION);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should call repository.findByOrganizationIdWithMeta with correct args', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(ORG_ID, PAGINATION);

      // Assert
      expect(
        mocks.tripInstanceRepository.findByOrganizationIdWithMeta,
      ).toHaveBeenCalledWith(ORG_ID, PAGINATION);
      expect(
        mocks.tripInstanceRepository.findByOrganizationIdWithMeta,
      ).toHaveBeenCalledTimes(1);
    });

    it('should return empty paginated response when organization has no instances', async () => {
      // Arrange
      mocks.tripInstanceRepository.findByOrganizationIdWithMeta.mockResolvedValue(
        makePaginatedResponse([]),
      );

      // Act
      const result = await sut.execute(ORG_ID, PAGINATION);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should forward the paginated response from the repository as-is', async () => {
      // Arrange
      const { paginated } = setupHappyPath(mocks);

      // Act
      const result = await sut.execute(ORG_ID, PAGINATION);

      // Assert
      expect(result).toBe(paginated);
    });
  });
});
