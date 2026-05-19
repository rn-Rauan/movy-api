import { UpdateOwnDriverUseCase } from 'src/modules/driver/application/use-cases/update-own-driver.use-case';
import { DriverRepository } from 'src/modules/driver/domain/interfaces';
import {
  DriverInactiveError,
  DriverProfileNotFoundError,
  DriverUpdateFailedError,
} from 'src/modules/driver/domain/entities/errors/driver.errors';
import { DriverStatus } from 'src/modules/driver/domain/interfaces/enums/driver-status.enum';
import { makeDriver } from '../../factories/driver.factory';

function makeMocks() {
  const driverRepository = {
    findByUserId: jest.fn(),
    update: jest.fn(),
  } as any as jest.Mocked<DriverRepository>;
  return { driverRepository };
}

const USER_ID = 'user-id-stub';

describe('UpdateOwnDriverUseCase', () => {
  let sut: UpdateOwnDriverUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new UpdateOwnDriverUseCase(mocks.driverRepository);
  });

  describe('happy paths', () => {
    it('updates only cnhExpiresAt when only that field is provided', async () => {
      const driver = makeDriver({ userId: USER_ID });
      mocks.driverRepository.findByUserId.mockResolvedValue(driver);
      mocks.driverRepository.update.mockImplementation(async (d) => d);

      const newDate = '2031-06-15';
      const result = await sut.execute(USER_ID, { cnhExpiresAt: newDate });

      expect(result.cnhExpiresAt.toISOString()).toBe(
        new Date(newDate).toISOString(),
      );
      expect([...result.cnhCategories.values]).toEqual(['B']);
      expect(mocks.driverRepository.update).toHaveBeenCalledTimes(1);
    });

    it('updates only cnhCategories when only that field is provided', async () => {
      const driver = makeDriver({ userId: USER_ID });
      mocks.driverRepository.findByUserId.mockResolvedValue(driver);
      mocks.driverRepository.update.mockImplementation(async (d) => d);

      const result = await sut.execute(USER_ID, {
        cnhCategories: ['A', 'B', 'D'],
      });

      expect([...result.cnhCategories.values]).toEqual(['A', 'B', 'D']);
      expect(mocks.driverRepository.update).toHaveBeenCalledTimes(1);
    });

    it('updates both fields when both are provided', async () => {
      const driver = makeDriver({ userId: USER_ID });
      mocks.driverRepository.findByUserId.mockResolvedValue(driver);
      mocks.driverRepository.update.mockImplementation(async (d) => d);

      const result = await sut.execute(USER_ID, {
        cnhExpiresAt: '2032-01-01',
        cnhCategories: ['A', 'B'],
      });

      expect(result.cnhExpiresAt.toISOString()).toBe(
        new Date('2032-01-01').toISOString(),
      );
      expect([...result.cnhCategories.values]).toEqual(['A', 'B']);
      expect(mocks.driverRepository.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('no-op payload', () => {
    it('returns current driver without persisting when payload is empty', async () => {
      const driver = makeDriver({ userId: USER_ID });
      mocks.driverRepository.findByUserId.mockResolvedValue(driver);

      const result = await sut.execute(USER_ID, {});

      expect(result).toBe(driver);
      expect(mocks.driverRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('error cases', () => {
    it('throws DriverProfileNotFoundError when user has no driver profile', async () => {
      mocks.driverRepository.findByUserId.mockResolvedValue(null);

      await expect(
        sut.execute(USER_ID, { cnhExpiresAt: '2031-01-01' }),
      ).rejects.toThrow(DriverProfileNotFoundError);
      expect(mocks.driverRepository.update).not.toHaveBeenCalled();
    });

    it('throws DriverInactiveError when driver is SUSPENDED', async () => {
      const suspended = makeDriver({
        userId: USER_ID,
        driverStatus: DriverStatus.SUSPENDED,
      });
      mocks.driverRepository.findByUserId.mockResolvedValue(suspended);

      await expect(
        sut.execute(USER_ID, { cnhExpiresAt: '2031-01-01' }),
      ).rejects.toThrow(DriverInactiveError);
    });

    it('throws DriverInactiveError when driver is INACTIVE', async () => {
      const inactive = makeDriver({
        userId: USER_ID,
        driverStatus: DriverStatus.INACTIVE,
      });
      mocks.driverRepository.findByUserId.mockResolvedValue(inactive);

      await expect(
        sut.execute(USER_ID, { cnhCategories: ['A'] }),
      ).rejects.toThrow(DriverInactiveError);
    });

    it('throws DriverUpdateFailedError when repository returns null', async () => {
      const driver = makeDriver({ userId: USER_ID });
      mocks.driverRepository.findByUserId.mockResolvedValue(driver);
      mocks.driverRepository.update.mockResolvedValue(null);

      await expect(
        sut.execute(USER_ID, { cnhExpiresAt: '2031-01-01' }),
      ).rejects.toThrow(DriverUpdateFailedError);
    });
  });
});
