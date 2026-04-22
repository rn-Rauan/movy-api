import { FindOrganizationByIdUseCase } from 'src/modules/organization/application/use-cases/find-organization-by-id.use-case';
import { OrganizationRepository } from 'src/modules/organization/domain/interfaces/organization.repository';
import {
  OrganizationNotFoundError,
  OrganizationForbiddenError,
} from 'src/modules/organization/domain/entities/errors/organization.errors';
import { TenantContextParams } from 'src/modules/organization/application/dtos';
import { makeOrganization } from '../../factories/organization.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const organizationRepository = {
    findById: jest.fn(),
  } as any as jest.Mocked<OrganizationRepository>;

  return { organizationRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const organization = makeOrganization({ id: ORG_ID });
  mocks.organizationRepository.findById.mockResolvedValue(organization);
  return { organization };
}

// ── Tests ───────────────────────────────────────────────

const ORG_ID = 'org-id-stub';

describe('FindOrganizationByIdUseCase', () => {
  let sut: FindOrganizationByIdUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FindOrganizationByIdUseCase(mocks.organizationRepository);
  });

  describe('happy path', () => {
    it('should find and return the active organization', async () => {
      // Arrange
      const { organization } = setupHappyPath(mocks);

      // Act
      const result = await sut.execute(ORG_ID);

      // Assert
      expect(result).toBe(organization);
    });

    it('should bypass tenant check when tenantContext is not provided', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act & Assert — no throw
      await expect(sut.execute(ORG_ID)).resolves.toBeDefined();
    });
  });

  describe('error — not found', () => {
    it('should throw OrganizationNotFoundError when org does not exist', async () => {
      // Arrange
      mocks.organizationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(ORG_ID)).rejects.toThrow(
        OrganizationNotFoundError,
      );
    });

    it('should throw OrganizationNotFoundError when org is inactive', async () => {
      // Arrange
      const inactiveOrg = makeOrganization({ id: ORG_ID });
      inactiveOrg.setStatus('INACTIVE');
      mocks.organizationRepository.findById.mockResolvedValue(inactiveOrg);

      // Act & Assert
      await expect(sut.execute(ORG_ID)).rejects.toThrow(
        OrganizationNotFoundError,
      );
    });
  });

  describe('error — access forbidden', () => {
    it('should throw OrganizationForbiddenError when caller is from a different org', async () => {
      // Arrange
      const organization = makeOrganization({ id: 'other-org-id' });
      mocks.organizationRepository.findById.mockResolvedValue(organization);

      const tenantContext: TenantContextParams = {
        isDev: false,
        tenantOrganizationId: ORG_ID,
      };

      // Act & Assert
      await expect(sut.execute('other-org-id', tenantContext)).rejects.toThrow(
        OrganizationForbiddenError,
      );
    });

    it('should NOT throw when caller is a dev (isDev = true)', async () => {
      // Arrange
      const organization = makeOrganization({ id: 'other-org-id' });
      mocks.organizationRepository.findById.mockResolvedValue(organization);

      const tenantContext: TenantContextParams = {
        isDev: true,
        tenantOrganizationId: ORG_ID,
      };

      // Act & Assert — dev bypasses tenant check
      await expect(
        sut.execute('other-org-id', tenantContext),
      ).resolves.toBeDefined();
    });
  });
});
