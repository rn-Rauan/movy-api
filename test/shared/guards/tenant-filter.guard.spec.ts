import type { ExecutionContext } from '@nestjs/common';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TenantFilterGuard } from 'src/shared/infrastructure/guards/tenant-filter.guard';
import type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface RequestShape {
  ctx: Partial<TenantContext> | null;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

function makeExecutionContext({
  ctx,
  params = {},
  query = {},
}: RequestShape): ExecutionContext {
  const request = {
    context: ctx ?? undefined,
    params,
    query,
  };

  return {
    switchToHttp: jest.fn().mockReturnValue({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TenantFilterGuard', () => {
  let sut: TenantFilterGuard;

  beforeEach(() => {
    sut = new TenantFilterGuard();
  });

  describe('missing context', () => {
    it('should throw BadRequestException when req.context is absent', () => {
      const ctx = makeExecutionContext({ ctx: null });

      expect(() => sut.canActivate(ctx)).toThrow(BadRequestException);
    });
  });

  describe('developer bypass', () => {
    it('should allow developer (isDev=true) regardless of params', () => {
      const ctx = makeExecutionContext({
        ctx: { userId: 'dev1', email: 'dev@test.com', isDev: true },
        params: { organizationId: 'totally-wrong-org' },
      });

      expect(sut.canActivate(ctx)).toBe(true);
    });

    it('should allow developer even without organizationId in JWT', () => {
      const ctx = makeExecutionContext({
        ctx: { userId: 'dev1', email: 'dev@test.com', isDev: true },
      });

      expect(sut.canActivate(ctx)).toBe(true);
    });
  });

  describe('organizationId param validation', () => {
    it('should allow when params.organizationId matches ctx.organizationId', () => {
      const ctx = makeExecutionContext({
        ctx: {
          userId: 'u1',
          email: 'u@test.com',
          isDev: false,
          organizationId: 'org-abc',
        },
        params: { organizationId: 'org-abc' },
      });

      expect(sut.canActivate(ctx)).toBe(true);
    });

    it('should throw ForbiddenException when params.organizationId does not match', () => {
      const ctx = makeExecutionContext({
        ctx: {
          userId: 'u1',
          email: 'u@test.com',
          isDev: false,
          organizationId: 'org-abc',
        },
        params: { organizationId: 'org-xyz' },
      });

      expect(() => sut.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow when alternate params.orgId matches ctx.organizationId', () => {
      const ctx = makeExecutionContext({
        ctx: {
          userId: 'u1',
          email: 'u@test.com',
          isDev: false,
          organizationId: 'org-abc',
        },
        params: { orgId: 'org-abc' },
      });

      expect(sut.canActivate(ctx)).toBe(true);
    });

    it('should allow when query.organizationId matches ctx.organizationId', () => {
      const ctx = makeExecutionContext({
        ctx: {
          userId: 'u1',
          email: 'u@test.com',
          isDev: false,
          organizationId: 'org-abc',
        },
        query: { organizationId: 'org-abc' },
      });

      expect(sut.canActivate(ctx)).toBe(true);
    });
  });

  describe('routes without organizationId param', () => {
    it('should allow org member on unscoped route (ctx has organizationId)', () => {
      const ctx = makeExecutionContext({
        ctx: {
          userId: 'u1',
          email: 'u@test.com',
          isDev: false,
          organizationId: 'org-abc',
        },
      });

      expect(sut.canActivate(ctx)).toBe(true);
    });

    it('should throw ForbiddenException for B2C user (no organizationId) on tenant-protected route', () => {
      const ctx = makeExecutionContext({
        ctx: {
          userId: 'b2c-user',
          email: 'b2c@test.com',
          isDev: false,
          organizationId: undefined,
        },
      });

      expect(() => sut.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
