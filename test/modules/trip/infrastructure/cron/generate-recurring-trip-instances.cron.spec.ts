import { GenerateRecurringTripInstancesCron } from 'src/modules/trip/infrastructure/cron/generate-recurring-trip-instances.cron';
import { GenerateRecurringTripInstancesUseCase } from 'src/modules/trip/application/use-cases/generate-recurring-trip-instances.use-case';

// ── Mocks ───────────────────────────────────────────────

function makeUseCaseMock() {
  return {
    execute: jest.fn().mockResolvedValue({ created: 0, skipped: 0, failed: 0 }),
  } as any as jest.Mocked<GenerateRecurringTripInstancesUseCase>;
}

// ── Tests ───────────────────────────────────────────────

describe('GenerateRecurringTripInstancesCron', () => {
  let sut: GenerateRecurringTripInstancesCron;
  let useCase: jest.Mocked<GenerateRecurringTripInstancesUseCase>;

  beforeEach(() => {
    useCase = makeUseCaseMock();
    sut = new GenerateRecurringTripInstancesCron(useCase);
  });

  describe('happy path', () => {
    it('should delegate to the use case once per tick', async () => {
      await sut.handle();
      expect(useCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('overlap protection', () => {
    it('should skip a tick when a previous sweep is still in flight', async () => {
      let resolveFirst!: () => void;
      useCase.execute.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = () => resolve({ created: 0, skipped: 0, failed: 0 });
          }),
      );

      const first = sut.handle();
      const second = sut.handle();

      await second;
      expect(useCase.execute).toHaveBeenCalledTimes(1);

      resolveFirst();
      await first;
    });

    it('should resume after a sweep completes', async () => {
      await sut.handle();
      await sut.handle();
      expect(useCase.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('error resilience', () => {
    it('should swallow top-level errors and clear isRunning', async () => {
      useCase.execute.mockRejectedValueOnce(new Error('DB down'));

      await expect(sut.handle()).resolves.toBeUndefined();

      await sut.handle();
      expect(useCase.execute).toHaveBeenCalledTimes(2);
    });
  });
});
