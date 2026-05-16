import { UpdateTripSchedulingConfigUseCase } from 'src/modules/scheduling/application/use-cases/update-trip-scheduling-config.use-case';
import { TripSchedulingConfigRepository } from 'src/modules/scheduling/domain/interfaces/trip-scheduling-config.repository';
import {
  InvalidSchedulingCronError,
  InvalidSchedulingDaysAheadError,
  TripSchedulingConfigNotFoundError,
} from 'src/modules/scheduling/domain/entities/errors/trip-scheduling-config.errors';
import { makeTripSchedulingConfig } from '../../factories/trip-scheduling-config.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const repository = {
    save: jest.fn(),
    findByOrganizationId: jest.fn(),
    update: jest.fn(),
  } as any as jest.Mocked<TripSchedulingConfigRepository>;

  return { repository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const config = makeTripSchedulingConfig();
  mocks.repository.findByOrganizationId.mockResolvedValue(config);
  mocks.repository.update.mockImplementation(async (entity) => entity);
  return { config };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';

describe('UpdateTripSchedulingConfigUseCase', () => {
  let sut: UpdateTripSchedulingConfigUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new UpdateTripSchedulingConfigUseCase(mocks.repository);
  });

  describe('happy path', () => {
    it('should update daysAhead, generationCron, autoCancelCron and enabled', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(ORG_ID, {
        daysAhead: 30,
        generationCron: '0 4 * * *',
        autoCancelCron: '*/10 * * * *',
        enabled: false,
      });

      // Assert
      expect(result.daysAhead).toBe(30);
      expect(result.generationCron).toBe('0 4 * * *');
      expect(result.autoCancelCron).toBe('*/10 * * * *');
      expect(result.enabled).toBe(false);
      expect(mocks.repository.update).toHaveBeenCalledTimes(1);
    });

    it('should ignore undefined fields without mutating others', async () => {
      // Arrange
      const { config } = setupHappyPath(mocks);
      const originalCron = config.generationCron;

      // Act
      await sut.execute(ORG_ID, { daysAhead: 7 });

      // Assert
      expect(config.daysAhead).toBe(7);
      expect(config.generationCron).toBe(originalCron);
    });
  });

  describe('error — not found', () => {
    it('should throw TripSchedulingConfigNotFoundError when no row exists', async () => {
      // Arrange
      mocks.repository.findByOrganizationId.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(ORG_ID, { daysAhead: 14 })).rejects.toThrow(
        TripSchedulingConfigNotFoundError,
      );
      expect(mocks.repository.update).not.toHaveBeenCalled();
    });
  });

  describe('error — validation', () => {
    it('should propagate InvalidSchedulingDaysAheadError', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act & Assert
      await expect(sut.execute(ORG_ID, { daysAhead: 0 })).rejects.toThrow(
        InvalidSchedulingDaysAheadError,
      );
      expect(mocks.repository.update).not.toHaveBeenCalled();
    });

    it('should propagate InvalidSchedulingCronError when cron is malformed', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act & Assert
      await expect(
        sut.execute(ORG_ID, { generationCron: 'invalid-cron' }),
      ).rejects.toThrow(InvalidSchedulingCronError);
      expect(mocks.repository.update).not.toHaveBeenCalled();
    });
  });
});
