import { FindAllTripInstancesByOrganizationUseCase } from 'src/modules/trip/application/use-cases/find-all-trip-instances-by-organization.use-case';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { PaginatedResponse } from 'src/shared/domain/interfaces';
import { TripInstance } from 'src/modules/trip/domain/entities';
import { makeTripInstance } from '../../factories/trip-instance.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripInstanceRepository = {
    findByOrganizationId: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  return { tripInstanceRepository };
}

function makePaginatedResponse(
  items: TripInstance[],
): PaginatedResponse<TripInstance> {
  return {
    data: items,
    total: items.length,
    page: 1,
    limit: 10,
    totalPages: 1,
  };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const instances = [
    makeTripInstance({ organizationId: ORG_ID }),
    makeTripInstance({ organizationId: ORG_ID }),
  ];
  const paginated = makePaginatedResponse(instances);

  mocks.tripInstanceRepository.findByOrganizationId.mockResolvedValue(paginated);

  return { instances, paginated };
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
      const { paginated } = setupHappyPath(mocks);

      // Act
      const result = await sut.execute(ORG_ID, PAGINATION);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should call repository.findByOrganizationId with correct args', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(ORG_ID, PAGINATION);

      // Assert
      expect(
        mocks.tripInstanceRepository.findByOrganizationId,
      ).toHaveBeenCalledWith(ORG_ID, PAGINATION);
      expect(
        mocks.tripInstanceRepository.findByOrganizationId,
      ).toHaveBeenCalledTimes(1);
    });

    it('should return empty paginated response when organization has no instances', async () => {
      // Arrange
      mocks.tripInstanceRepository.findByOrganizationId.mockResolvedValue(
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
