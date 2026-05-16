import { AutoCancelTripInstancesCron } from 'src/modules/trip/infrastructure/cron/auto-cancel-trip-instances.cron';
import { CancelExpiredTripInstancesUseCase } from 'src/modules/trip/application/use-cases/cancel-expired-trip-instances.use-case';

// ── Mocks ───────────────────────────────────────────────

function makeUseCaseMock() {
  return {
    execute: jest.fn().mockResolvedValue({ canceled: 0, failed: 0 }),
  } as any as jest.Mocked<CancelExpiredTripInstancesUseCase>;
}

// ── Tests ───────────────────────────────────────────────

describe('AutoCancelTripInstancesCron', () => {
  let sut: AutoCancelTripInstancesCron;
  let useCase: jest.Mocked<CancelExpiredTripInstancesUseCase>;

  beforeEach(() => {
    useCase = makeUseCaseMock();
    sut = new AutoCancelTripInstancesCron(useCase);
  });

  describe('happy path', () => {
    it('should delegate to the use case once per tick', async () => {
      await sut.handle();
      expect(useCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('overlap protection', () => {
    it('should skip a tick when a previous sweep is still in flight', async () => {
      // Arrange — first execute() hangs until we resolve it manually
      let resolveFirst!: () => void;
      useCase.execute.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = () => resolve({ canceled: 0, failed: 0 });
          }),
      );

      // Act — kick the first tick (don't await) then fire a second one
      const first = sut.handle();
      const second = sut.handle();

      await second;
      // The second tick should have noop'd
      expect(useCase.execute).toHaveBeenCalledTimes(1);

      // Cleanup — let the first one finish
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

      // First tick rejects internally but does not throw outward
      await expect(sut.handle()).resolves.toBeUndefined();

      // A subsequent tick must still run (lock released by finally)
      await sut.handle();
      expect(useCase.execute).toHaveBeenCalledTimes(2);
    });
  });
});
