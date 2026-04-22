import { FindAllTripTemplatesByOrganizationUseCase } from 'src/modules/trip/application/use-cases/find-all-trip-templates-by-organization.use-case';
import { TripTemplateRepository } from 'src/modules/trip/domain/interfaces';
import { PaginatedResponse } from 'src/shared/domain/interfaces';
import { TripTemplate } from 'src/modules/trip/domain/entities';
import { makeTripTemplate } from '../../factories/trip-template.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripTemplateRepository = {
    findByOrganizationId: jest.fn(),
  } as any as jest.Mocked<TripTemplateRepository>;

  return { tripTemplateRepository };
}

function makePaginatedResponse(
  items: TripTemplate[],
): PaginatedResponse<TripTemplate> {
  return {
    data: items,
    total: items.length,
    page: 1,
    limit: 10,
    totalPages: 1,
  };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const templates = [
    makeTripTemplate({ organizationId: ORG_ID }),
    makeTripTemplate({ organizationId: ORG_ID }),
  ];
  const paginated = makePaginatedResponse(templates);

  mocks.tripTemplateRepository.findByOrganizationId.mockResolvedValue(paginated);

  return { templates, paginated };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const PAGINATION = { page: 1, limit: 10 };

describe('FindAllTripTemplatesByOrganizationUseCase', () => {
  let sut: FindAllTripTemplatesByOrganizationUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindAllTripTemplatesByOrganizationUseCase(
      mocks.tripTemplateRepository,
    );
  });

  describe('happy path', () => {
    it('should return paginated list of trip templates for the organization', async () => {
      // Arrange
      setupHappyPath(mocks);

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
        mocks.tripTemplateRepository.findByOrganizationId,
      ).toHaveBeenCalledWith(ORG_ID, PAGINATION);
      expect(
        mocks.tripTemplateRepository.findByOrganizationId,
      ).toHaveBeenCalledTimes(1);
    });

    it('should return empty paginated response when organization has no templates', async () => {
      // Arrange
      mocks.tripTemplateRepository.findByOrganizationId.mockResolvedValue(
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
