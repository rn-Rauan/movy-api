import { FindTripInstancesByTemplateUseCase } from 'src/modules/trip/application/use-cases/find-trip-instances-by-template.use-case';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import { TripTemplateRepository } from 'src/modules/trip/domain/interfaces/trip-template.repository';
import {
  TripTemplateAccessForbiddenError,
  TripTemplateNotFoundError,
} from 'src/modules/trip/domain/entities/errors/trip-template.errors';
import { PaginatedResponse } from 'src/shared/domain/interfaces';
import { TripInstance } from 'src/modules/trip/domain/entities';
import { makeTripInstance } from '../../factories/trip-instance.factory';
import { makeTripTemplate } from '../../factories/trip-template.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripInstanceRepository = {
    findByTemplateId: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  const tripTemplateRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<TripTemplateRepository>;

  return { tripInstanceRepository, tripTemplateRepository };
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
  const template = makeTripTemplate({
    id: TEMPLATE_ID,
    organizationId: ORG_ID,
  });
  const instances = [
    makeTripInstance({ organizationId: ORG_ID, tripTemplateId: TEMPLATE_ID }),
    makeTripInstance({ organizationId: ORG_ID, tripTemplateId: TEMPLATE_ID }),
  ];
  const paginated = makePaginatedResponse(instances);

  mocks.tripTemplateRepository.findById.mockResolvedValue(template);
  mocks.tripInstanceRepository.findByTemplateId.mockResolvedValue(paginated);

  return { template, instances, paginated };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const TEMPLATE_ID = 'template-id-stub';
const PAGINATION = { page: 1, limit: 10 };

describe('FindTripInstancesByTemplateUseCase', () => {
  let sut: FindTripInstancesByTemplateUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindTripInstancesByTemplateUseCase(
      mocks.tripInstanceRepository,
      mocks.tripTemplateRepository,
    );
  });

  describe('happy path', () => {
    it('should return paginated instances for a valid template', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(TEMPLATE_ID, ORG_ID, PAGINATION);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should call tripTemplateRepository.findById with the provided templateId', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(TEMPLATE_ID, ORG_ID, PAGINATION);

      // Assert
      expect(mocks.tripTemplateRepository.findById).toHaveBeenCalledWith(
        TEMPLATE_ID,
      );
      expect(mocks.tripTemplateRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should call tripInstanceRepository.findByTemplateId with correct args', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(TEMPLATE_ID, ORG_ID, PAGINATION);

      // Assert
      expect(
        mocks.tripInstanceRepository.findByTemplateId,
      ).toHaveBeenCalledWith(TEMPLATE_ID, PAGINATION);
      expect(
        mocks.tripInstanceRepository.findByTemplateId,
      ).toHaveBeenCalledTimes(1);
    });

    it('should forward the paginated response from the repository as-is', async () => {
      // Arrange
      const { paginated } = setupHappyPath(mocks);

      // Act
      const result = await sut.execute(TEMPLATE_ID, ORG_ID, PAGINATION);

      // Assert
      expect(result).toBe(paginated);
    });
  });

  describe('error — template not found', () => {
    it('should throw TripTemplateNotFoundError when template does not exist', async () => {
      // Arrange
      mocks.tripTemplateRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(TEMPLATE_ID, ORG_ID, PAGINATION),
      ).rejects.toThrow(TripTemplateNotFoundError);
    });

    it('should NOT call tripInstanceRepository when template is not found', async () => {
      // Arrange
      mocks.tripTemplateRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sut.execute(TEMPLATE_ID, ORG_ID, PAGINATION),
      ).rejects.toThrow(TripTemplateNotFoundError);

      expect(
        mocks.tripInstanceRepository.findByTemplateId,
      ).not.toHaveBeenCalled();
    });
  });

  describe('error — forbidden access', () => {
    it('should throw TripTemplateAccessForbiddenError when template belongs to another org', async () => {
      // Arrange
      const template = makeTripTemplate({
        id: TEMPLATE_ID,
        organizationId: 'other-org-id',
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);

      // Act & Assert
      await expect(
        sut.execute(TEMPLATE_ID, ORG_ID, PAGINATION),
      ).rejects.toThrow(TripTemplateAccessForbiddenError);
    });

    it('should NOT call tripInstanceRepository when org check fails', async () => {
      // Arrange
      const template = makeTripTemplate({
        id: TEMPLATE_ID,
        organizationId: 'other-org-id',
      });
      mocks.tripTemplateRepository.findById.mockResolvedValue(template);

      // Act & Assert
      await expect(
        sut.execute(TEMPLATE_ID, ORG_ID, PAGINATION),
      ).rejects.toThrow(TripTemplateAccessForbiddenError);

      expect(
        mocks.tripInstanceRepository.findByTemplateId,
      ).not.toHaveBeenCalled();
    });
  });
});
