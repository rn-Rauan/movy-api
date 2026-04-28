import type { ExecutionContext } from '@nestjs/common';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DevGuard } from 'src/shared/infrastructure/guards/dev.guard';
import { DEV_ONLY_KEY } from 'src/shared/infrastructure/decorators/dev.decorator';
import type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeContext(
  ctx: Partial<TenantContext> | null,
  isDevOnly: boolean,
): { reflector: Reflector; executionContext: ExecutionContext } {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(isDevOnly),
  } as unknown as Reflector;

  const request = { context: ctx ?? undefined };
  const executionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { reflector, executionContext };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DevGuard', () => {
  describe('route without @Dev() decorator', () => {
    it('should allow any authenticated user through (no decorator = no restriction)', () => {
      const { reflector, executionContext } = makeContext(
        { userId: 'u1', email: 'u@test.com', isDev: false },
        false,
      );
      const sut = new DevGuard(reflector);

      expect(sut.canActivate(executionContext)).toBe(true);
    });

    it('should allow dev user through when route has no @Dev()', () => {
      const { reflector, executionContext } = makeContext(
        { userId: 'u1', email: 'u@test.com', isDev: true },
        false,
      );
      const sut = new DevGuard(reflector);

      expect(sut.canActivate(executionContext)).toBe(true);
    });

    it('should allow even when context is null (no middleware ran)', () => {
      const { reflector, executionContext } = makeContext(null, false);
      const sut = new DevGuard(reflector);

      // Sem @Dev(), o guard retorna true sem verificar contexto
      expect(sut.canActivate(executionContext)).toBe(true);
    });
  });

  describe('route with @Dev() decorator', () => {
    it('should allow developer (isDev=true) through', () => {
      const { reflector, executionContext } = makeContext(
        { userId: 'dev1', email: 'dev@test.com', isDev: true },
        true,
      );
      const sut = new DevGuard(reflector);

      expect(sut.canActivate(executionContext)).toBe(true);
    });

    it('should throw ForbiddenException for non-dev user (isDev=false)', () => {
      const { reflector, executionContext } = makeContext(
        { userId: 'u1', email: 'u@test.com', isDev: false, role: 'ADMIN' },
        true,
      );
      const sut = new DevGuard(reflector);

      expect(() => sut.canActivate(executionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for DRIVER user (isDev=false)', () => {
      const { reflector, executionContext } = makeContext(
        { userId: 'u1', email: 'u@test.com', isDev: false, role: 'DRIVER' },
        true,
      );
      const sut = new DevGuard(reflector);

      expect(() => sut.canActivate(executionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when context is missing', () => {
      const { reflector, executionContext } = makeContext(null, true);
      const sut = new DevGuard(reflector);

      expect(() => sut.canActivate(executionContext)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('reflector metadata lookup', () => {
    it('should check handler and class for DEV_ONLY_KEY metadata', () => {
      const handler = jest.fn();
      const cls = jest.fn();
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      } as unknown as Reflector;
      const request = {
        context: { userId: 'u1', email: 'u@test.com', isDev: false },
      };
      const executionContext = {
        getHandler: jest.fn().mockReturnValue(handler),
        getClass: jest.fn().mockReturnValue(cls),
        switchToHttp: jest.fn().mockReturnValue({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      const sut = new DevGuard(reflector);
      sut.canActivate(executionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(DEV_ONLY_KEY, [
        handler,
        cls,
      ]);
    });
  });
});
