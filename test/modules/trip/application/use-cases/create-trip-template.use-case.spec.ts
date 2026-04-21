import { CreateTripTemplateUseCase } from 'src/modules/trip/application/use-cases/create-trip-template.use-case';
import { TripTemplateRepository } from 'src/modules/trip/domain/interfaces/trip-template.repository';
import {
  TripTemplateCreationFailedError,
  InvalidTripPriceConfigurationError,
} from 'src/modules/trip/domain/entities/errors/trip-template.errors';
import { makeCreateTripTemplateDto } from '../../factories/create-trip-template.dto.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripTemplateRepository = {
    save: jest.fn(),
  } as any as jest.Mocked<TripTemplateRepository>;

  return { tripTemplateRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  mocks.tripTemplateRepository.save.mockImplementation(
    async (entity) => entity,
  );
}

// ── Tests ───────────────────────────────────────────────

describe('CreateTripTemplateUseCase', () => {
  let sut: CreateTripTemplateUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  const ORG_ID = 'org-id-stub';

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CreateTripTemplateUseCase(mocks.tripTemplateRepository);
  });

  describe('happy path', () => {
    it('should create and return a new trip template', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripTemplateDto();

      // Act
      const result = await sut.execute(dto, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.organizationId).toBe(ORG_ID);
      expect(result.departurePoint).toBe(dto.departurePoint);
      expect(result.destination).toBe(dto.destination);
      expect(result.priceOneWay?.toNumber()).toBe(dto.priceOneWay);
    });

    it('should call repository.save exactly once', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripTemplateDto();

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      expect(mocks.tripTemplateRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should persist entity with correct organizationId and shift', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripTemplateDto();

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      const savedEntity = mocks.tripTemplateRepository.save.mock.calls[0][0];
      expect(savedEntity.organizationId).toBe(ORG_ID);
      expect(savedEntity.shift).toBe(dto.shift);
      expect(savedEntity.status).toBe('ACTIVE');
    });
  });

  describe('error — persistence failure', () => {
    it('should throw TripTemplateCreationFailedError when save returns null', async () => {
      // Arrange
      mocks.tripTemplateRepository.save.mockResolvedValue(null);
      const dto = makeCreateTripTemplateDto();

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        TripTemplateCreationFailedError,
      );
    });
  });

  describe('error — domain validation', () => {
    it('should propagate InvalidTripPriceConfigurationError when no price is provided', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreateTripTemplateDto({ priceOneWay: undefined });

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        InvalidTripPriceConfigurationError,
      );
      expect(mocks.tripTemplateRepository.save).not.toHaveBeenCalled();
    });
  });
});
