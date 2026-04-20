import { DeactivateTripTemplateUseCase } from 'src/modules/trip/application/use-cases/deactivate-trip-template.use-case';
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
    update: jest.fn(),
  } as any as jest.Mocked<TripTemplateRepository>;

  return { tripTemplateRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const tripTemplate = makeTripTemplate();

  mocks.tripTemplateRepository.findById.mockResolvedValue(tripTemplate);
  mocks.tripTemplateRepository.update.mockImplementation(
    async (entity) => entity,
  );

  return { tripTemplate };
}

// ── Tests ───────────────────────────────────────────────

describe('DeactivateTripTemplateUseCase', () => {
  let sut: DeactivateTripTemplateUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  const ORG_ID = 'org-id-stub';
  const TEMPLATE_ID = 'trip-template-id-stub';

  beforeEach(() => {
    mocks = makeMocks();
    sut = new DeactivateTripTemplateUseCase(mocks.tripTemplateRepository);
  });

  describe('happy path', () => {
    it('should find, deactivate, and update the trip template', async () => {
      // Arrange
      const { tripTemplate } = setupHappyPath(mocks);

      // Act
      await sut.execute(TEMPLATE_ID, ORG_ID);

      // Assert
      expect(tripTemplate.status).toBe('INACTIVE');
      expect(mocks.tripTemplateRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should call repository.update with deactivated entity', async () => {
      // Arrange
      const { tripTemplate } = setupHappyPath(mocks);

      // Act
      await sut.execute(TEMPLATE_ID, ORG_ID);

      // Assert
      expect(mocks.tripTemplateRepository.update).toHaveBeenCalledWith(
        tripTemplate,
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
      expect(mocks.tripTemplateRepository.update).not.toHaveBeenCalled();
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
      expect(mocks.tripTemplateRepository.update).not.toHaveBeenCalled();
    });
  });
});
