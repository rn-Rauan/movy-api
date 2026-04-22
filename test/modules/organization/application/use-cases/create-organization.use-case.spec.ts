import { CreateOrganizationUseCase } from 'src/modules/organization/application/use-cases/create-organization.use-case';
import { OrganizationRepository } from 'src/modules/organization/domain/interfaces/organization.repository';
import { OrganizationAlreadyExistsError } from 'src/modules/organization/domain/entities/errors/organization.errors';
import { CreateOrganizationDto } from 'src/modules/organization/application/dtos';
import { makeOrganization } from '../../factories/organization.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const organizationRepository = {
    findByCnpj: jest.fn(),
    findBySlug: jest.fn(),
    save: jest.fn(),
  } as any as jest.Mocked<OrganizationRepository>;

  return { organizationRepository };
}

const validDto: CreateOrganizationDto = {
  name: 'Stub Org',
  cnpj: '11222333000181',
  email: 'org@stub.com',
  telephone: '9999999999',
  address: 'Rua Stub, 123',
  slug: 'stub-org',
};

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  mocks.organizationRepository.findByCnpj.mockResolvedValue(null);
  mocks.organizationRepository.findBySlug.mockResolvedValue(null);
  mocks.organizationRepository.save.mockResolvedValue(undefined);
}

// ── Tests ───────────────────────────────────────────────

describe('CreateOrganizationUseCase', () => {
  let sut: CreateOrganizationUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CreateOrganizationUseCase(mocks.organizationRepository);
  });

  describe('happy path', () => {
    it('should create and return a new organization', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      const result = await sut.execute(validDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.slug).toBe(validDto.slug);
    });

    it('should call repository.save exactly once', async () => {
      // Arrange
      setupHappyPath(mocks);

      // Act
      await sut.execute(validDto);

      // Assert
      expect(mocks.organizationRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('error — cnpj already exists', () => {
    it('should throw OrganizationAlreadyExistsError when CNPJ is taken', async () => {
      // Arrange
      mocks.organizationRepository.findByCnpj.mockResolvedValue(
        makeOrganization(),
      );

      // Act & Assert
      await expect(sut.execute(validDto)).rejects.toThrow(
        OrganizationAlreadyExistsError,
      );
      expect(mocks.organizationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error — slug already exists', () => {
    it('should throw OrganizationAlreadyExistsError when slug is taken', async () => {
      // Arrange
      mocks.organizationRepository.findByCnpj.mockResolvedValue(null);
      mocks.organizationRepository.findBySlug.mockResolvedValue(
        makeOrganization(),
      );

      // Act & Assert
      await expect(sut.execute(validDto)).rejects.toThrow(
        OrganizationAlreadyExistsError,
      );
      expect(mocks.organizationRepository.save).not.toHaveBeenCalled();
    });
  });
});
