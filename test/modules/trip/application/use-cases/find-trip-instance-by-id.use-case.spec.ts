import { FindTripInstanceByIdUseCase } from 'src/modules/trip/application/use-cases/find-trip-instance-by-id.use-case';
import {
  TripInstanceRepository,
  TripInstanceWithMeta,
} from 'src/modules/trip/domain/interfaces';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { makeTripInstance } from '../../factories/trip-instance.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripInstanceRepository = {
    findByIdWithMeta: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  return { tripInstanceRepository };
}

function makeMeta(
  overrides: Partial<TripInstanceWithMeta> = {},
): TripInstanceWithMeta {
  const instance =
    overrides.instance ?? makeTripInstance({ organizationId: ORG_ID });
  return {
    instance,
    bookedCount: overrides.bookedCount ?? 5,
    templateId: overrides.templateId ?? instance.tripTemplateId,
    departurePoint: overrides.departurePoint ?? 'Origin',
    destination: overrides.destination ?? 'Destination',
    stops: overrides.stops ?? ['Origin', 'Stop 1', 'Destination'],
    priceOneWay: overrides.priceOneWay ?? null,
    priceReturn: overrides.priceReturn ?? null,
    priceRoundTrip: overrides.priceRoundTrip ?? null,
    isRecurring: overrides.isRecurring ?? false,
  };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const meta = makeMeta();
  mocks.tripInstanceRepository.findByIdWithMeta.mockResolvedValue(meta);
  return { meta };
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
    it('should return the enriched trip instance when found and org matches', async () => {
      // Arrange
      const { meta } = setupHappyPath(mocks);

      // Act
      const result = await sut.execute(INSTANCE_ID, ORG_ID);

      // Assert
      expect(result).toBe(meta);
      expect(result.instance.organizationId).toBe(ORG_ID);
      expect(result.bookedCount).toBe(5);
      expect(result.stops).toEqual(['Origin', 'Stop 1', 'Destination']);
    });

    it('should call repository.findByIdWithMeta with the provided id', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(INSTANCE_ID, ORG_ID);

      // Assert
      expect(
        mocks.tripInstanceRepository.findByIdWithMeta,
      ).toHaveBeenCalledWith(INSTANCE_ID);
      expect(
        mocks.tripInstanceRepository.findByIdWithMeta,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('error — not found', () => {
    it('should throw TripInstanceNotFoundError when instance does not exist', async () => {
      // Arrange
      mocks.tripInstanceRepository.findByIdWithMeta.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(INSTANCE_ID, ORG_ID)).rejects.toThrow(
        TripInstanceNotFoundError,
      );
    });
  });

  describe('happy path — no organizationId (passenger)', () => {
    it('should return the trip instance without org check when organizationId is omitted', async () => {
      // Arrange
      const meta = makeMeta({
        instance: makeTripInstance({ organizationId: 'any-org' }),
      });
      mocks.tripInstanceRepository.findByIdWithMeta.mockResolvedValue(meta);

      // Act
      const result = await sut.execute(INSTANCE_ID);

      // Assert
      expect(result).toBe(meta);
    });
  });

  describe('error — cross-org access', () => {
    it('should throw TripInstanceAccessForbiddenError when instance belongs to another org', async () => {
      // Arrange
      const meta = makeMeta({
        instance: makeTripInstance({ organizationId: 'other-org' }),
      });
      mocks.tripInstanceRepository.findByIdWithMeta.mockResolvedValue(meta);

      // Act & Assert
      await expect(sut.execute(INSTANCE_ID, ORG_ID)).rejects.toThrow(
        TripInstanceAccessForbiddenError,
      );
    });
  });
});
