import { UpdateTripTemplateUseCase } from 'src/modules/trip/application/use-cases/update-trip-template.use-case';
import { TripTemplateRepository } from 'src/modules/trip/domain/interfaces/trip-template.repository';
import {
  TripTemplateNotFoundError,
  TripTemplateAccessForbiddenError,
  TripTemplateInactiveError,
} from 'src/modules/trip/domain/entities/errors/trip-template.errors';
import { makeTripTemplate } from '../../factories/trip-template.factory';
import { makeUpdateTripTemplateDto } from '../../factories/update-trip-template.dto.factory';

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

describe('UpdateTripTemplateUseCase', () => {
  let sut: UpdateTripTemplateUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  const ORG_ID = 'org-id-stub';
  const TEMPLATE_ID = 'trip-template-id-stub';

  beforeEach(() => {
    mocks = makeMocks();
    sut = new UpdateTripTemplateUseCase(mocks.tripTemplateRepository);
  });

  describe('happy path — route update', () => {
    it('should find, update route, and return updated template', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeUpdateTripTemplateDto({
        departurePoint: 'Nova Origem',
        destination: 'Novo Destino',
      });

      // Act
      const result = await sut.execute(TEMPLATE_ID, dto, ORG_ID);

      // Assert
      expect(result.departurePoint).toBe('Nova Origem');
      expect(result.destination).toBe('Novo Destino');
      expect(mocks.tripTemplateRepository.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('happy path — pricing update', () => {
    it('should update pricing when price fields are provided', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeUpdateTripTemplateDto({ priceReturn: 15 });

      // Act
      const result = await sut.execute(TEMPLATE_ID, dto, ORG_ID);

      // Assert
      expect(result.priceReturn?.toNumber()).toBe(15);
      expect(result.priceOneWay?.toNumber()).toBe(12.5);
    });
  });

  describe('happy path — stops update', () => {
    it('should update stops when stops field is provided', async () => {
      // Arrange
      setupHappyPath(mocks);
      const newStops = ['Ponto A', 'Ponto B', 'Ponto C'];
      const dto = makeUpdateTripTemplateDto({ stops: newStops });

      // Act
      const result = await sut.execute(TEMPLATE_ID, dto, ORG_ID);

      // Assert
      expect(result.stops).toEqual(newStops);
    });
  });

  describe('happy path — auto-cancel config', () => {
    it('should enable auto-cancel with minRevenue and offset', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeUpdateTripTemplateDto({
        autoCancelEnabled: true,
        minRevenue: 100,
        autoCancelOffset: 30,
      });

      // Act
      const result = await sut.execute(TEMPLATE_ID, dto, ORG_ID);

      // Assert
      expect(result.autoCancelEnabled).toBe(true);
      expect(result.minRevenue?.toNumber()).toBe(100);
      expect(result.autoCancelOffset).toBe(30);
    });
  });

  describe('error — template not found', () => {
    it('should throw TripTemplateNotFoundError when template does not exist', async () => {
      // Arrange
      mocks.tripTemplateRepository.findById.mockResolvedValue(null);
      const dto = makeUpdateTripTemplateDto({ departurePoint: 'Anywhere' });

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, dto, ORG_ID)).rejects.toThrow(
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
      const dto = makeUpdateTripTemplateDto({ departurePoint: 'Anywhere' });

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, dto, ORG_ID)).rejects.toThrow(
        TripTemplateAccessForbiddenError,
      );
      expect(mocks.tripTemplateRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — inactive template', () => {
    it('should throw TripTemplateInactiveError when template is inactive', async () => {
      // Arrange
      const tripTemplate = makeTripTemplate({ status: 'INACTIVE' });
      mocks.tripTemplateRepository.findById.mockResolvedValue(tripTemplate);
      const dto = makeUpdateTripTemplateDto({ departurePoint: 'Anywhere' });

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, dto, ORG_ID)).rejects.toThrow(
        TripTemplateInactiveError,
      );
      expect(mocks.tripTemplateRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — update persistence failure', () => {
    it('should throw TripTemplateNotFoundError when update returns null', async () => {
      // Arrange
      const tripTemplate = makeTripTemplate();
      mocks.tripTemplateRepository.findById.mockResolvedValue(tripTemplate);
      mocks.tripTemplateRepository.update.mockResolvedValue(null);
      const dto = makeUpdateTripTemplateDto({ departurePoint: 'Nova Origem' });

      // Act & Assert
      await expect(sut.execute(TEMPLATE_ID, dto, ORG_ID)).rejects.toThrow(
        TripTemplateNotFoundError,
      );
    });
  });
});
