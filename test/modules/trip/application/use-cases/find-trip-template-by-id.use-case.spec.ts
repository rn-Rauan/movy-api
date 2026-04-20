import { FindTripTemplateByIdUseCase } from 'src/modules/trip/application/use-cases/find-trip-template-by-id.use-case';
import { TripTemplateRepository } from 'src/modules/trip/domain/interfaces/trip-template.repository';
import {
  TripTemplateNotFoundError,
  TripTemplateAccessForbiddenError,
} from 'src/modules/trip/domain/entities/errors/trip-template.errors';
import { makeTripTemplate } from '../../factories/trip-template.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripTemplateRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<TripTemplateRepository>;

  return { tripTemplateRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const tripTemplate = makeTripTemplate();
  mocks.tripTemplateRepository.findById.mockResolvedValue(tripTemplate);

  return { tripTemplate };
}

// ── Tests ───────────────────────────────────────────────

describe('FindTripTemplateByIdUseCase', () => {
  let sut: FindTripTemplateByIdUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  const ORG_ID = 'org-id-stub';
  const TEMPLATE_ID = 'trip-template-id-stub';

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindTripTemplateByIdUseCase(mocks.tripTemplateRepository);
  });

  describe('happy path', () => {
    it('should find and return the trip template', async () => {
      // Arrange
      const { tripTemplate } = setupHappyPath(mocks);

      // Act
      const result = await sut.execute(TEMPLATE_ID, ORG_ID);

      // Assert
      expect(result).toBe(tripTemplate);
    });

    it('should call repository.findById with correct id', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(TEMPLATE_ID, ORG_ID);

      // Assert
      expect(mocks.tripTemplateRepository.findById).toHaveBeenCalledWith(
        TEMPLATE_ID,
      );
    });
  });

  describe('error — not found', () => {
    it('should throw TripTemplateNotFoundError when template does not exist', async () => {
      // Arrange
      mocks.tripTemplateRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, ORG_ID)).rejects.toThrow(
        TripTemplateNotFoundError,
      );
    });
  });

  describe('error — access forbidden', () => {
    it('should throw TripTemplateAccessForbiddenError when org does not match', async () => {
      // Arrange
      const tripTemplate = makeTripTemplate({ organizationId: 'other-org-id' });
      mocks.tripTemplateRepository.findById.mockResolvedValue(tripTemplate);

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, ORG_ID)).rejects.toThrow(
        TripTemplateAccessForbiddenError,
      );
    });
  });
});
