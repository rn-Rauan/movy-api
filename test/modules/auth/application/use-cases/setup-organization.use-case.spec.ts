import { JwtService } from '@nestjs/jwt';
import { JwtPayloadService } from 'src/modules/auth/application/services/jwt-payload.service';
import { SetupOrganizationForExistingUserUseCase } from 'src/modules/auth/application/use-cases';
import { CreateOrganizationUseCase } from 'src/modules/organization/application/use-cases';
import { CreateMembershipUseCase } from 'src/modules/membership/application/use-cases';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { RoleName } from 'src/shared/domain/types';
import { RoleNotFoundError } from 'src/shared/domain/errors/roles.error';
import { makeUser } from '../../../user/factories/user.factory';
import { makeOrganization } from '../../../organization/factories/organization.factory';
import { makeRole } from '../../../../shared/factories/role.factory';
import { makeJwtPayload } from '../../factories/jwt-payload.factory';
import { makeSetupOrgDto } from '../../factories/setup-org.dto.factory';

// ── Mock helpers ────────────────────────────────────────────

function makeMocks() {
  const createOrganizationUseCase = {
    execute: jest.fn(),
  } as any as jest.Mocked<CreateOrganizationUseCase>;

  const createMembershipUseCase = {
    execute: jest.fn(),
  } as any as jest.Mocked<CreateMembershipUseCase>;

  const roleRepository = {
    findByName: jest.fn(),
  } as any as jest.Mocked<RoleRepository>;

  const userRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<UserRepository>;

  const jwtService = {
    sign: jest.fn(),
  } as any as jest.Mocked<JwtService>;

  const jwtPayloadService = {
    enrichPayload: jest.fn(),
  } as any as jest.Mocked<JwtPayloadService>;

  return {
    createOrganizationUseCase,
    createMembershipUseCase,
    roleRepository,
    userRepository,
    jwtService,
    jwtPayloadService,
  };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const user = makeUser();
  const organization = makeOrganization();
  const adminRole = makeRole({ name: RoleName.ADMIN });

  mocks.userRepository.findById.mockResolvedValue(user);
  mocks.createOrganizationUseCase.execute.mockResolvedValue(organization);
  mocks.roleRepository.findByName.mockResolvedValue(adminRole);
  mocks.createMembershipUseCase.execute.mockResolvedValue({} as any);
  mocks.jwtPayloadService.enrichPayload.mockResolvedValue(
    makeJwtPayload({
      sub: user.id,
      email: user.email,
      organizationId: organization.id,
    }),
  );
  mocks.jwtService.sign
    .mockReturnValueOnce('access-token-stub')
    .mockReturnValueOnce('refresh-token-stub');

  return { user, organization, adminRole };
}

// ── Tests ───────────────────────────────────────────────────

describe('SetupOrganizationForExistingUserUseCase', () => {
  let sut: SetupOrganizationForExistingUserUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  const USER_ID = 'user-id-stub';

  beforeEach(() => {
    mocks = makeMocks();
    sut = new SetupOrganizationForExistingUserUseCase(
      mocks.createOrganizationUseCase,
      mocks.createMembershipUseCase,
      mocks.roleRepository,
      mocks.userRepository,
      mocks.jwtService,
      mocks.jwtPayloadService,
    );
  });

  describe('happy path', () => {
    it('should return TokenResponseDto with tokens and user info', async () => {
      // Arrange
      const dto = makeSetupOrgDto();
      const { user } = setupHappyPath(mocks);

      // Act
      const result = await sut.execute(dto, USER_ID);

      // Assert
      expect(result.accessToken).toBe('access-token-stub');
      expect(result.refreshToken).toBe('refresh-token-stub');
      expect(result.user).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    });

    it('should orchestrate findUser → createOrg → findRole → createMembership → signJWT', async () => {
      // Arrange
      const dto = makeSetupOrgDto();
      const { user, organization, adminRole } = setupHappyPath(mocks);

      // Act
      await sut.execute(dto, USER_ID);

      // Assert
      expect(mocks.userRepository.findById).toHaveBeenCalledWith(USER_ID);
      expect(mocks.createOrganizationUseCase.execute).toHaveBeenCalledWith({
        name: dto.organizationName,
        cnpj: dto.cnpj,
        email: dto.organizationEmail,
        telephone: dto.organizationTelephone,
        address: dto.address,
        slug: dto.slug,
      });
      expect(mocks.roleRepository.findByName).toHaveBeenCalledWith(
        RoleName.ADMIN,
      );
      expect(mocks.createMembershipUseCase.execute).toHaveBeenCalledWith(
        { userEmail: user.email, roleId: adminRole.id },
        organization.id,
      );
      expect(mocks.jwtPayloadService.enrichPayload).toHaveBeenCalledWith(
        USER_ID,
      );
      expect(mocks.jwtService.sign).toHaveBeenCalledTimes(2);
      expect(mocks.jwtService.sign).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ sub: user.id }),
        { expiresIn: '7d' },
      );
    });
  });

  describe('error — user not found', () => {
    it('should throw when user does not exist', async () => {
      // Arrange
      mocks.userRepository.findById.mockResolvedValue(null);
      const dto = makeSetupOrgDto();

      // Act & Assert
      await expect(sut.execute(dto, USER_ID)).rejects.toThrow(
        'User not found or inactive',
      );
      expect(mocks.createOrganizationUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('error — user inactive', () => {
    it('should throw when user status is INACTIVE', async () => {
      // Arrange
      const inactiveUser = makeUser();
      inactiveUser.setStatus('INACTIVE');
      mocks.userRepository.findById.mockResolvedValue(inactiveUser);
      const dto = makeSetupOrgDto();

      // Act & Assert
      await expect(sut.execute(dto, USER_ID)).rejects.toThrow(
        'User not found or inactive',
      );
      expect(mocks.createOrganizationUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('error — ADMIN role not found', () => {
    it('should throw RoleNotFoundError and leave org orphan', async () => {
      // Arrange
      const user = makeUser();
      const organization = makeOrganization();

      mocks.userRepository.findById.mockResolvedValue(user);
      mocks.createOrganizationUseCase.execute.mockResolvedValue(organization);
      mocks.roleRepository.findByName.mockResolvedValue(null);

      const dto = makeSetupOrgDto();

      // Act & Assert
      await expect(sut.execute(dto, USER_ID)).rejects.toThrow(
        RoleNotFoundError,
      );
      expect(mocks.jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('error — membership creation fails', () => {
    it('should rethrow and not sign JWT when membership fails', async () => {
      // Arrange
      const user = makeUser();
      const organization = makeOrganization();
      const adminRole = makeRole();

      mocks.userRepository.findById.mockResolvedValue(user);
      mocks.createOrganizationUseCase.execute.mockResolvedValue(organization);
      mocks.roleRepository.findByName.mockResolvedValue(adminRole);
      mocks.createMembershipUseCase.execute.mockRejectedValue(
        new Error('Membership boom'),
      );

      const dto = makeSetupOrgDto();

      // Act & Assert
      await expect(sut.execute(dto, USER_ID)).rejects.toThrow(
        'Membership boom',
      );
      expect(mocks.jwtService.sign).not.toHaveBeenCalled();
    });
  });
});
