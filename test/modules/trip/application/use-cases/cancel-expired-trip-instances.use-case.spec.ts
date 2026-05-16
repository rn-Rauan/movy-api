import { CancelExpiredTripInstancesUseCase } from 'src/modules/trip/application/use-cases/cancel-expired-trip-instances.use-case';
import {
  TripInstanceRepository,
  TripStatus,
} from 'src/modules/trip/domain/interfaces';
import { OrganizationRepository } from 'src/modules/organization/domain/interfaces/organization.repository';
import { makeOrganization } from '../../../organization/factories/organization.factory';
import { makeTripInstance } from '../../factories/trip-instance.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const tripInstanceRepository = {
    findExpiredOpenInstances: jest.fn(),
    update: jest.fn(),
  } as any as jest.Mocked<TripInstanceRepository>;

  const organizationRepository = {
    findAllActiveUnpaginated: jest.fn(),
  } as any as jest.Mocked<OrganizationRepository>;

  return { tripInstanceRepository, organizationRepository };
}

// Helper: build an instance in a cancellable state with autoCancelAt already past.
function makeExpiredInstance(orgId: string) {
  return makeTripInstance({
    organizationId: orgId,
    tripStatus: TripStatus.SCHEDULED,
    autoCancelAt: new Date(Date.now() - 60_000),
  });
}

// ── Tests ───────────────────────────────────────────────

describe('CancelExpiredTripInstancesUseCase', () => {
  let sut: CancelExpiredTripInstancesUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CancelExpiredTripInstancesUseCase(
      mocks.tripInstanceRepository,
      mocks.organizationRepository,
    );
  });

  describe('happy path — no work to do', () => {
    it('should return 0/0 and skip the inner lookup when there are no active orgs', async () => {
      // Arrange
      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue(
        [],
      );

      // Act
      const result = await sut.execute();

      // Assert
      expect(result).toEqual({ canceled: 0, failed: 0 });
      expect(
        mocks.tripInstanceRepository.findExpiredOpenInstances,
      ).not.toHaveBeenCalled();
      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });

    it('should return 0/0 when active orgs exist but no instances are expired', async () => {
      // Arrange
      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        makeOrganization({ id: 'org-1' }),
        makeOrganization({ id: 'org-2' }),
      ]);
      mocks.tripInstanceRepository.findExpiredOpenInstances.mockResolvedValue(
        [],
      );

      // Act
      const result = await sut.execute();

      // Assert
      expect(result).toEqual({ canceled: 0, failed: 0 });
      expect(
        mocks.tripInstanceRepository.findExpiredOpenInstances,
      ).toHaveBeenCalledTimes(2);
      expect(mocks.tripInstanceRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('happy path — cancellations', () => {
    it('should cancel every expired instance and call update once per row', async () => {
      // Arrange
      const org = makeOrganization({ id: 'org-1' });
      const instances = [
        makeExpiredInstance(org.id),
        makeExpiredInstance(org.id),
        makeExpiredInstance(org.id),
      ];
      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.tripInstanceRepository.findExpiredOpenInstances.mockResolvedValue(
        instances,
      );
      mocks.tripInstanceRepository.update.mockImplementation(
        async (entity) => entity,
      );

      // Act
      const result = await sut.execute();

      // Assert
      expect(result).toEqual({ canceled: 3, failed: 0 });
      expect(mocks.tripInstanceRepository.update).toHaveBeenCalledTimes(3);
      // Each saved entity must be in CANCELED state
      for (const call of mocks.tripInstanceRepository.update.mock.calls) {
        expect(call[0].tripStatus).toBe(TripStatus.CANCELED);
      }
    });

    it('should fan out across multiple orgs and aggregate the counters', async () => {
      // Arrange
      const orgA = makeOrganization({ id: 'org-a' });
      const orgB = makeOrganization({ id: 'org-b' });
      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        orgA,
        orgB,
      ]);
      mocks.tripInstanceRepository.findExpiredOpenInstances
        .mockResolvedValueOnce([makeExpiredInstance(orgA.id)])
        .mockResolvedValueOnce([
          makeExpiredInstance(orgB.id),
          makeExpiredInstance(orgB.id),
        ]);
      mocks.tripInstanceRepository.update.mockImplementation(
        async (entity) => entity,
      );

      // Act
      const result = await sut.execute();

      // Assert
      expect(result).toEqual({ canceled: 3, failed: 0 });
    });
  });

  describe('resilience — failures do not abort the sweep', () => {
    it('should increment failed and continue when update rejects on one instance', async () => {
      // Arrange
      const org = makeOrganization({ id: 'org-1' });
      const okA = makeExpiredInstance(org.id);
      const bad = makeExpiredInstance(org.id);
      const okB = makeExpiredInstance(org.id);
      mocks.organizationRepository.findAllActiveUnpaginated.mockResolvedValue([
        org,
      ]);
      mocks.tripInstanceRepository.findExpiredOpenInstances.mockResolvedValue([
        okA,
        bad,
        okB,
      ]);

      mocks.tripInstanceRepository.update.mockImplementation(async (entity) => {
        if (entity.id === bad.id) {
          throw new Error('simulated DB write failure');
        }
        return entity;
      });

      // Act
      const result = await sut.execute();

      // Assert
      expect(result).toEqual({ canceled: 2, failed: 1 });
      expect(mocks.tripInstanceRepository.update).toHaveBeenCalledTimes(3);
    });
  });
});
