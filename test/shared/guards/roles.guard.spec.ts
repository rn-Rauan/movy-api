import type { ExecutionContext } from '@nestjs/common';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from 'src/shared/infrastructure/guards/roles.guard';
import { ROLES_KEY } from 'src/shared/infrastructure/decorators/roles.decorator';
import type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';
import { RoleName } from 'src/shared/domain/types/role-name.enum';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeContext(
  requiredRoles: string[] | null,
  ctx: Partial<TenantContext> | null,
): { reflector: Reflector; executionContext: ExecutionContext } {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
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

describe('RolesGuard', () => {
  describe('route without @Roles() decorator', () => {
    it('should allow any user when no roles are required', () => {
      const { reflector, executionContext } = makeContext(null, {
        userId: 'u1',
        email: 'u@test.com',
        isDev: false,
        role: 'DRIVER',
      });
      const sut = new RolesGuard(reflector);

      expect(sut.canActivate(executionContext)).toBe(true);
    });

    it('should allow when roles array is empty', () => {
      const { reflector, executionContext } = makeContext([], {
        userId: 'u1',
        email: 'u@test.com',
        isDev: false,
      });
      const sut = new RolesGuard(reflector);

      expect(sut.canActivate(executionContext)).toBe(true);
    });
  });

  describe('route with @Roles() decorator', () => {
    it('should allow ADMIN user on ADMIN-only route', () => {
      const { reflector, executionContext } = makeContext([RoleName.ADMIN], {
        userId: 'u1',
        email: 'u@test.com',
        isDev: false,
        role: 'ADMIN',
      });
      const sut = new RolesGuard(reflector);

      expect(sut.canActivate(executionContext)).toBe(true);
    });

    it('should throw ForbiddenException for DRIVER on ADMIN-only route', () => {
      const { reflector, executionContext } = makeContext([RoleName.ADMIN], {
        userId: 'u1',
        email: 'u@test.com',
        isDev: false,
        role: 'DRIVER',
      });
      const sut = new RolesGuard(reflector);

      expect(() => sut.canActivate(executionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should allow DRIVER user on multi-role route (ADMIN | DRIVER)', () => {
      const { reflector, executionContext } = makeContext(
        [RoleName.ADMIN, RoleName.DRIVER],
        { userId: 'u1', email: 'u@test.com', isDev: false, role: 'DRIVER' },
      );
      const sut = new RolesGuard(reflector);

      expect(sut.canActivate(executionContext)).toBe(true);
    });

    it('should throw ForbiddenException when user has no role in context', () => {
      const { reflector, executionContext } = makeContext([RoleName.ADMIN], {
        userId: 'u1',
        email: 'u@test.com',
        isDev: false,
        role: undefined,
      });
      const sut = new RolesGuard(reflector);

      expect(() => sut.canActivate(executionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should bypass role check for developer (isDev=true)', () => {
      const { reflector, executionContext } = makeContext([RoleName.ADMIN], {
        userId: 'dev1',
        email: 'dev@test.com',
        isDev: true,
        role: undefined,
      });
      const sut = new RolesGuard(reflector);

      expect(sut.canActivate(executionContext)).toBe(true);
    });

    it('should throw BadRequestException when context is missing', () => {
      const { reflector, executionContext } = makeContext(
        [RoleName.ADMIN],
        null,
      );
      const sut = new RolesGuard(reflector);

      expect(() => sut.canActivate(executionContext)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('reflector metadata lookup', () => {
    it('should check handler and class for ROLES_KEY metadata', () => {
      const handler = jest.fn();
      const cls = jest.fn();
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(null),
      } as unknown as Reflector;
      const request = {
        context: { userId: 'u1', email: 'u@test.com', isDev: false },
      };
      const executionContext = {
        getHandler: jest.fn().mockReturnValue(handler),
        getClass: jest.fn().mockReturnValue(cls),
        switchToHttp: jest.fn().mockReturnValue({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      const sut = new RolesGuard(reflector);
      sut.canActivate(executionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        handler,
        cls,
      ]);
    });
  });
});
