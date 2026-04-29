import { JwtService } from '@nestjs/jwt';
import { JwtPayloadService } from 'src/modules/auth/application/services/jwt-payload.service';
import { RegisterOrganizationWithAdminUseCase } from 'src/modules/auth/application/use-cases';
import { CreateMembershipUseCase } from 'src/modules/membership/application/use-cases';
import { CreateOrganizationUseCase } from 'src/modules/organization/application/use-cases';
import { CreateUserUseCase } from 'src/modules/user/application/use-cases';
import { SubscribeToPlanUseCase } from 'src/modules/subscriptions/application/use-cases';
import { PlanRepository } from 'src/modules/plans/domain/interfaces/plan.repository';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { RoleName } from 'src/shared/domain/types';
import { RoleNotFoundError } from 'src/shared/domain/errors/roles.error';
import { makeUser } from '../../../user/factories/user.factory';
import { makeOrganization } from '../../../organization/factories/organization.factory';
import { makeRole } from '../../../../shared/factories/role.factory';
import { makeJwtPayload } from '../../factories/jwt-payload.factory';
import { makeRegisterOrgDto } from '../../factories/register-org.dto.factory';
import { TransactionManager } from 'src/shared/infrastructure/database/transaction-manager';
import { makeMembership } from 'test/modules/membership/factories/membership.factory';

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
  const transactionManager = {
    runInTransaction: jest.fn(async (fn: () => Promise<unknown>) => fn()),
  } as any as jest.Mocked<TransactionManager>;

  const subscribeToPlanUseCase = {
    execute: jest.fn().mockResolvedValue({}),
  } as any as jest.Mocked<SubscribeToPlanUseCase>;

  const planRepository = {
    findByName: jest.fn().mockResolvedValue(null),
  } as any as jest.Mocked<PlanRepository>;

  return {
    createUserUseCase,
    createOrganizationUseCase,
    createMembershipUseCase,
    roleRepository,
    jwtService,
    jwtPayloadService,
    transactionManager,
    subscribeToPlanUseCase,
    planRepository,
  };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const user = makeUser({ email: 'admin@stub.com' });
  const organization = makeOrganization();
  const adminRole = makeRole({ name: RoleName.ADMIN });
  const membership = makeMembership();

  mocks.createUserUseCase.execute.mockResolvedValue(user);
  mocks.createOrganizationUseCase.execute.mockResolvedValue(organization);
  mocks.roleRepository.findByName.mockResolvedValue(adminRole);
  mocks.createMembershipUseCase.execute.mockResolvedValue(membership);
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
      mocks.transactionManager,
      mocks.subscribeToPlanUseCase,
      mocks.planRepository,
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

  describe('error — org creation fails', () => {
    it('should rethrow when createOrganization fails', async () => {
      // Arrange
      const dto = makeRegisterOrgDto();
      const user = makeUser({ email: dto.userEmail });
      const orgError = new Error('CNPJ already exists');

      mocks.createUserUseCase.execute.mockResolvedValue(user);
      mocks.createOrganizationUseCase.execute.mockRejectedValue(orgError);

      // Act & Assert
      await expect(sut.execute(dto)).rejects.toThrow(orgError);
      expect(mocks.createMembershipUseCase.execute).not.toHaveBeenCalled();
      expect(mocks.jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('error — membership creation fails', () => {
    it('should rethrow when createMembership fails', async () => {
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
      expect(mocks.jwtService.sign).not.toHaveBeenCalled();
    });

    it('should rethrow when ADMIN role is not found', async () => {
      // Arrange
      const dto = makeRegisterOrgDto();
      const user = makeUser({ email: dto.userEmail });
      const organization = makeOrganization();

      mocks.createUserUseCase.execute.mockResolvedValue(user);
      mocks.createOrganizationUseCase.execute.mockResolvedValue(organization);
      mocks.roleRepository.findByName.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(dto)).rejects.toThrow(RoleNotFoundError);
      expect(mocks.jwtService.sign).not.toHaveBeenCalled();
    });
  });
});
