import { CreateMembershipUseCase } from 'src/modules/membership/application/use-cases';
import { MembershipRepository } from 'src/modules/membership/domain/interfaces/membership.repository';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { RoleName } from 'src/shared/domain/types';
import {
  UserNotFoundForMembershipError,
  DriverNotFoundForMembershipError,
  MembershipAlreadyExistsError,
} from 'src/modules/membership/domain/entities';
import { makeUser } from '../../../user/factories/user.factory';
import { makeRole } from '../../../../shared/factories/role.factory';
import { makeMembership } from '../../factories/membership.factory';
import { makeDriver } from '../../../driver/factories/driver.factory';

// ── Mock helpers ────────────────────────────────────────────

function makeMocks() {
  const membershipRepository = {
    findByCompositeKey: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  } as any as jest.Mocked<MembershipRepository>;

  const userRepository = {
    findByEmail: jest.fn(),
  } as any as jest.Mocked<UserRepository>;

  const driverRepository = {
    findByUserId: jest.fn(),
  } as any as jest.Mocked<DriverRepository>;

  const roleRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<RoleRepository>;

  return { membershipRepository, userRepository, driverRepository, roleRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const user = makeUser();
  const adminRole = makeRole({ id: 1, name: RoleName.ADMIN });

  mocks.userRepository.findByEmail.mockResolvedValue(user);
  mocks.roleRepository.findById.mockResolvedValue(adminRole);
  mocks.membershipRepository.findByCompositeKey.mockResolvedValue(null);
  mocks.membershipRepository.save.mockImplementation(async (m) => m);

  return { user, adminRole };
}

// ── Tests ───────────────────────────────────────────────────

describe('CreateMembershipUseCase', () => {
  let sut: CreateMembershipUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  const ORG_ID = 'org-id-stub';

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CreateMembershipUseCase(
      mocks.membershipRepository,
      mocks.userRepository,
      mocks.driverRepository,
      mocks.roleRepository,
    );
  });

  describe('happy path — new ADMIN membership', () => {
    it('should create and return a new membership', async () => {
      // Arrange
      const { user } = setupHappyPath(mocks);
      const dto = { userEmail: user.email, roleId: 1 };

      // Act
      const result = await sut.execute(dto, ORG_ID);

      // Assert
      expect(result.userId).toBe(user.id);
      expect(result.roleId).toBe(dto.roleId);
      expect(result.organizationId).toBe(ORG_ID);
      expect(mocks.membershipRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should check user, role, and existing membership in order', async () => {
      // Arrange
      const { user, adminRole } = setupHappyPath(mocks);
      const dto = { userEmail: user.email, roleId: adminRole.id };

      // Act
      await sut.execute(dto, ORG_ID);

      // Assert
      expect(mocks.userRepository.findByEmail).toHaveBeenCalledWith(user.email);
      expect(mocks.roleRepository.findById).toHaveBeenCalledWith(adminRole.id);
      expect(mocks.membershipRepository.findByCompositeKey).toHaveBeenCalledWith(
        user.id,
        adminRole.id,
        ORG_ID,
      );
    });
  });

  describe('happy path — DRIVER membership with driver profile', () => {
    it('should create membership when user has a driver profile', async () => {
      // Arrange
      const user = makeUser();
      const driverRole = makeRole({ id: 2, name: RoleName.DRIVER });
      const driver = makeDriver({ userId: user.id });

      mocks.userRepository.findByEmail.mockResolvedValue(user);
      mocks.roleRepository.findById.mockResolvedValue(driverRole);
      mocks.driverRepository.findByUserId.mockResolvedValue(driver);
      mocks.membershipRepository.findByCompositeKey.mockResolvedValue(null);
      mocks.membershipRepository.save.mockImplementation(async (m) => m);

      const dto = { userEmail: user.email, roleId: 2 };

      // Act
      const result = await sut.execute(dto, ORG_ID);

      // Assert
      expect(result.userId).toBe(user.id);
      expect(result.roleId).toBe(2);
      expect(mocks.driverRepository.findByUserId).toHaveBeenCalledWith(user.id);
    });
  });

  describe('restore removed membership', () => {
    it('should restore a soft-deleted membership instead of creating a new one', async () => {
      // Arrange
      const user = makeUser();
      const removedMembership = makeMembership({
        userId: user.id,
        organizationId: ORG_ID,
        removedAt: new Date('2025-06-01'),
      });

      mocks.userRepository.findByEmail.mockResolvedValue(user);
      mocks.roleRepository.findById.mockResolvedValue(makeRole());
      mocks.membershipRepository.findByCompositeKey.mockResolvedValue(removedMembership);
      mocks.membershipRepository.update.mockResolvedValue(removedMembership);

      const dto = { userEmail: user.email, roleId: 1 };

      // Act
      const result = await sut.execute(dto, ORG_ID);

      // Assert
      expect(result.removedAt).toBeNull();
      expect(mocks.membershipRepository.update).toHaveBeenCalledWith(removedMembership);
      expect(mocks.membershipRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error — user not found', () => {
    it('should throw UserNotFoundForMembershipError when user does not exist', async () => {
      // Arrange
      mocks.userRepository.findByEmail.mockResolvedValue(null);
      const dto = { userEmail: 'ghost@nowhere.com', roleId: 1 };

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        UserNotFoundForMembershipError,
      );
      expect(mocks.membershipRepository.findByCompositeKey).not.toHaveBeenCalled();
    });
  });

  describe('error — DRIVER role without driver profile', () => {
    it('should throw DriverNotFoundForMembershipError when user has no driver profile', async () => {
      // Arrange
      const user = makeUser();
      const driverRole = makeRole({ id: 2, name: RoleName.DRIVER });

      mocks.userRepository.findByEmail.mockResolvedValue(user);
      mocks.roleRepository.findById.mockResolvedValue(driverRole);
      mocks.driverRepository.findByUserId.mockResolvedValue(null);

      const dto = { userEmail: user.email, roleId: 2 };

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        DriverNotFoundForMembershipError,
      );
      expect(mocks.membershipRepository.findByCompositeKey).not.toHaveBeenCalled();
    });
  });

  describe('error — membership already active', () => {
    it('should throw MembershipAlreadyExistsError when active membership exists', async () => {
      // Arrange
      const user = makeUser();
      const activeMembership = makeMembership({
        userId: user.id,
        organizationId: ORG_ID,
      });

      mocks.userRepository.findByEmail.mockResolvedValue(user);
      mocks.roleRepository.findById.mockResolvedValue(makeRole());
      mocks.membershipRepository.findByCompositeKey.mockResolvedValue(activeMembership);

      const dto = { userEmail: user.email, roleId: 1 };

      // Act & Assert
      await expect(sut.execute(dto, ORG_ID)).rejects.toThrow(
        MembershipAlreadyExistsError,
      );
      expect(mocks.membershipRepository.save).not.toHaveBeenCalled();
    });
  });
});
