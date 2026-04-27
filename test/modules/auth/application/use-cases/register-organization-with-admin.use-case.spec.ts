import { JwtService } from '@nestjs/jwt';
import { JwtPayloadService } from 'src/modules/auth/application/services/jwt-payload.service';
import { RegisterOrganizationWithAdminUseCase } from 'src/modules/auth/application/use-cases';
import { CreateMembershipUseCase } from 'src/modules/membership/application/use-cases';
import { CreateOrganizationUseCase } from 'src/modules/organization/application/use-cases';
import { CreateUserUseCase } from 'src/modules/user/application/use-cases';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { OrganizationRepository } from 'src/modules/organization/domain/interfaces/organization.repository';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { RoleName } from 'src/shared/domain/types';
import { RoleNotFoundError } from 'src/shared/domain/errors/roles.error';
import { makeUser } from '../../../user/factories/user.factory';
import { makeOrganization } from '../../../organization/factories/organization.factory';
import { makeRole } from '../../../../shared/factories/role.factory';
import { makeJwtPayload } from '../../factories/jwt-payload.factory';
import { makeRegisterOrgDto } from '../../factories/register-org.dto.factory';

// ── Mock helpers ────────────────────────────────────────────

function makeMocks() {
  const createUserUseCase = {
    execute: jest.fn(),
  } as any as jest.Mocked<CreateUserUseCase>;
  const createOrganizationUseCase = {
    execute: jest.fn(),
  } as any as jest.Mocked<CreateOrganizationUseCase>;
  const createMembershipUseCase = {
    execute: jest.fn(),
  } as any as jest.Mocked<CreateMembershipUseCase>;
  const roleRepository = {
    findByName: jest.fn(),
  } as any as jest.Mocked<RoleRepository>;
  const jwtService = { sign: jest.fn() } as any as jest.Mocked<JwtService>;
  const jwtPayloadService = {
    enrichPayload: jest.fn(),
  } as any as jest.Mocked<JwtPayloadService>;
  const userRepository = {
    delete: jest.fn(),
  } as any as jest.Mocked<UserRepository>;

  const organizationRepository = {
    delete: jest.fn(),
  } as any as jest.Mocked<OrganizationRepository>;

  return {
    createUserUseCase,
    createOrganizationUseCase,
    createMembershipUseCase,
    roleRepository,
    jwtService,
    jwtPayloadService,
    userRepository,
    organizationRepository,
  };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const user = makeUser({ email: 'admin@stub.com' });
  const organization = makeOrganization();
  const adminRole = makeRole({ name: RoleName.ADMIN });

  mocks.createUserUseCase.execute.mockResolvedValue(user);
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

describe('RegisterOrganizationWithAdminUseCase', () => {
  let sut: RegisterOrganizationWithAdminUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new RegisterOrganizationWithAdminUseCase(
      mocks.createUserUseCase,
      mocks.createOrganizationUseCase,
      mocks.createMembershipUseCase,
      mocks.roleRepository,
      mocks.jwtService,
      mocks.jwtPayloadService,
      mocks.userRepository,
      mocks.organizationRepository,
    );
  });

  describe('happy path', () => {
    it('should return TokenResponseDto with tokens and user info', async () => {
      // Arrange
      const dto = makeRegisterOrgDto();
      const { user } = setupHappyPath(mocks);

      // Act
      const result = await sut.execute(dto);

      // Assert
      expect(result.accessToken).toBe('access-token-stub');
      expect(result.refreshToken).toBe('refresh-token-stub');
      expect(result.user).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    });

    it('should orchestrate create user → create org → find role → create membership → sign JWT', async () => {
      // Arrange
      const dto = makeRegisterOrgDto();
      const { user, organization, adminRole } = setupHappyPath(mocks);

      // Act
      await sut.execute(dto);

      // Assert — ordem de chamadas
      expect(mocks.createUserUseCase.execute).toHaveBeenCalledWith({
        name: dto.userName,
        email: dto.userEmail,
        password: dto.userPassword,
        telephone: dto.userTelephone,
      });
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
        { userEmail: dto.userEmail, roleId: adminRole.id },
        organization.id,
      );
      expect(mocks.jwtPayloadService.enrichPayload).toHaveBeenCalledWith(
        user.id,
      );
      expect(mocks.jwtService.sign).toHaveBeenCalledTimes(2);
      expect(mocks.jwtService.sign).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ sub: user.id }),
        { expiresIn: '7d' },
      );
    });
  });

  describe('compensation — org creation fails', () => {
    it('should delete user and rethrow when createOrganization fails', async () => {
      // Arrange
      const dto = makeRegisterOrgDto();
      const user = makeUser({ email: dto.userEmail });
      const orgError = new Error('CNPJ already exists');

      mocks.createUserUseCase.execute.mockResolvedValue(user);
      mocks.createOrganizationUseCase.execute.mockRejectedValue(orgError);

      // Act & Assert
      await expect(sut.execute(dto)).rejects.toThrow(orgError);
      expect(mocks.userRepository.delete).toHaveBeenCalledWith(user.id);
      expect(mocks.createMembershipUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('compensation — membership creation fails', () => {
    it('should delete user and rethrow when createMembership fails', async () => {
      // Arrange
      const dto = makeRegisterOrgDto();
      const user = makeUser({ email: dto.userEmail });
      const organization = makeOrganization();
      const adminRole = makeRole();
      const membershipError = new Error('Membership failed');

      mocks.createUserUseCase.execute.mockResolvedValue(user);
      mocks.createOrganizationUseCase.execute.mockResolvedValue(organization);
      mocks.roleRepository.findByName.mockResolvedValue(adminRole);
      mocks.createMembershipUseCase.execute.mockRejectedValue(membershipError);

      // Act & Assert
      await expect(sut.execute(dto)).rejects.toThrow(membershipError);
      expect(mocks.userRepository.delete).toHaveBeenCalledWith(user.id);
      expect(mocks.jwtService.sign).not.toHaveBeenCalled();
    });

    it('should delete user and rethrow when ADMIN role is not found', async () => {
      // Arrange
      const dto = makeRegisterOrgDto();
      const user = makeUser({ email: dto.userEmail });
      const organization = makeOrganization();

      mocks.createUserUseCase.execute.mockResolvedValue(user);
      mocks.createOrganizationUseCase.execute.mockResolvedValue(organization);
      mocks.roleRepository.findByName.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(dto)).rejects.toThrow(RoleNotFoundError);
      expect(mocks.userRepository.delete).toHaveBeenCalledWith(user.id);
    });
  });
});
