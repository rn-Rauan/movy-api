import { CreatePlanUseCase } from 'src/modules/plans/application/use-cases/create-plan.use-case';
import { PlanRepository } from 'src/modules/plans/domain/interfaces/plan.repository';
import {
  PlanAlreadyExistsError,
  PlanCreationFailedError,
} from 'src/modules/plans/domain/errors/plan.errors';
import { makePlan } from '../../factories/plan.factory';
import { makeCreatePlanDto } from '../../factories/create-plan.dto.factory';

function makeMocks() {
  const planRepository = {
    save: jest.fn(),
    findByName: jest.fn(),
  } as any as jest.Mocked<PlanRepository>;

  return { planRepository };
}

function setupHappyPath(mocks: ReturnType<typeof makeMocks>) {
  const plan = makePlan();

  mocks.planRepository.findByName.mockResolvedValue(null);
  mocks.planRepository.save.mockResolvedValue(plan);

  return { plan };
}

describe('CreatePlanUseCase', () => {
  let sut: CreatePlanUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new CreatePlanUseCase(mocks.planRepository);
  });

  describe('happy path', () => {
    it('should create and return plan entity', async () => {
      // Arrange
      const { plan } = setupHappyPath(mocks);
      const dto = makeCreatePlanDto();

      // Act
      const result = await sut.execute(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(plan.id);
      expect(result.name).toBe(plan.name);
      expect(result.durationDays).toBe(plan.durationDays);
    });

    it('should call planRepository.save once with correct durationDays', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreatePlanDto({ durationDays: 90 });

      // Act
      await sut.execute(dto);

      // Assert
      expect(mocks.planRepository.save).toHaveBeenCalledTimes(1);
      const savedEntity = mocks.planRepository.save.mock.calls[0][0];
      expect(savedEntity.durationDays).toBe(90);
    });

    it('should check name uniqueness before persisting', async () => {
      // Arrange
      setupHappyPath(mocks);
      const dto = makeCreatePlanDto();

      // Act
      await sut.execute(dto);

      // Assert - findByName must be called before save
      const findOrder =
        mocks.planRepository.findByName.mock.invocationCallOrder[0];
      const saveOrder = mocks.planRepository.save.mock.invocationCallOrder[0];
      expect(findOrder).toBeLessThan(saveOrder);
    });
  });

  describe('error - duplicate plan name', () => {
    it('should throw PlanAlreadyExistsError when name already exists', async () => {
      // Arrange
      mocks.planRepository.findByName.mockResolvedValue(makePlan());
      const dto = makeCreatePlanDto();

      // Act & Assert
      await expect(sut.execute(dto)).rejects.toThrow(PlanAlreadyExistsError);
    });

    it('should NOT call save when name already exists', async () => {
      // Arrange
      mocks.planRepository.findByName.mockResolvedValue(makePlan());
      const dto = makeCreatePlanDto();

      // Act
      await expect(sut.execute(dto)).rejects.toThrow(PlanAlreadyExistsError);

      // Assert
      expect(mocks.planRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error - persistence failure', () => {
    it('should throw PlanCreationFailedError when save returns null', async () => {
      // Arrange
      mocks.planRepository.findByName.mockResolvedValue(null);
      mocks.planRepository.save.mockResolvedValue(null);
      const dto = makeCreatePlanDto();

      // Act & Assert
      await expect(sut.execute(dto)).rejects.toThrow(PlanCreationFailedError);
    });
  });
});
