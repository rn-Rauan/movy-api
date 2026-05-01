import { FindTripInstanceByIdUseCase } from 'src/modules/trip/application/use-cases/find-trip-instance-by-id.use-case';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces/trip-instance.repository';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { makeTripInstance } from '../../factories/trip-instance.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripInstanceRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  return { tripInstanceRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const instance = makeTripInstance({ organizationId: ORG_ID });

  mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

  return { instance };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';
const INSTANCE_ID = 'trip-instance-id-stub';

describe('FindTripInstanceByIdUseCase', () => {
  let sut: FindTripInstanceByIdUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindTripInstanceByIdUseCase(mocks.tripInstanceRepository);
  });

  describe('happy path', () => {
    it('should return the trip instance when found and org matches', async () => {
      // Arrange
      const { instance } = setupHappyPath(mocks);

      // Act
      const result = await sut.execute(INSTANCE_ID, ORG_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.organizationId).toBe(ORG_ID);
      expect(result).toBe(instance);
    });

    it('should call repository.findById with the provided id', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(INSTANCE_ID, ORG_ID);

      // Assert
      expect(mocks.tripInstanceRepository.findById).toHaveBeenCalledWith(
        INSTANCE_ID,
      );
      expect(mocks.tripInstanceRepository.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('error — not found', () => {
    it('should throw TripInstanceNotFoundError when instance does not exist', async () => {
      // Arrange
      mocks.tripInstanceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(INSTANCE_ID, ORG_ID)).rejects.toThrow(
        TripInstanceNotFoundError,
      );
    });
  });

  describe('happy path — no organizationId (passenger)', () => {
    it('should return the trip instance without org check when organizationId is omitted', async () => {
      // Arrange
      const instance = makeTripInstance({ organizationId: 'any-org' });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act
      const result = await sut.execute(INSTANCE_ID);

      // Assert
      expect(result).toBe(instance);
    });
  });

  describe('error — cross-org access', () => {
    it('should throw TripInstanceAccessForbiddenError when instance belongs to another org', async () => {
      // Arrange
      const instance = makeTripInstance({ organizationId: 'other-org' });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act & Assert
      await expect(sut.execute(INSTANCE_ID, ORG_ID)).rejects.toThrow(
        TripInstanceAccessForbiddenError,
      );
    });

    it('should NOT expose instance data when org differs (throw before return)', async () => {
      // Arrange
      const instance = makeTripInstance({ organizationId: 'other-org' });
      mocks.tripInstanceRepository.findById.mockResolvedValue(instance);

      // Act
      const call = sut.execute(INSTANCE_ID, ORG_ID);

      // Assert — cannot distinguish not-found from forbidden in HTTP layer via error type
      await expect(call).rejects.toThrow(TripInstanceAccessForbiddenError);
    });
  });
});
