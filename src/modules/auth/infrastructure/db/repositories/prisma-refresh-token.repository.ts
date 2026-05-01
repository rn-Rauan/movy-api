import { Injectable } from '@nestjs/common';
import { DbContext } from 'src/shared/infrastructure/database/db-context';
import { RefreshTokenRepository } from 'src/modules/auth/domain/interfaces/refresh-token-repository.interface';

/**
 * Prisma-backed implementation of {@link RefreshTokenRepository}.
 *
 * @remarks
 * All I/O targets the `refresh_tokens` table via `DbContext`, which is
 * transaction-aware — the correct Prisma client (transaction-scoped or root)
 * is resolved automatically at call time.
 */
@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly dbContext: DbContext) {}

  /** Returns the active Prisma client (transaction-scoped if a UoW is active). */
  private get db() {
    return this.dbContext.client;
  }

  /**
   * Inserts a new JTI row via `prisma.refreshToken.create`.
   *
   * @param jti - UUID `jti` claim from the signed refresh token
   * @param userId - UUID of the owning user
   * @param expiresAt - Absolute expiry timestamp
   */
  async save(jti: string, userId: string, expiresAt: Date): Promise<void> {
    await this.db.refreshToken.create({ data: { jti, userId, expiresAt } });
  }

  /**
   * Looks up a JTI record by its primary key.
   *
   * @param jti - UUID to find
   * @returns `{ jti, userId }` if the record exists, or `null`
   */
  async findByJti(
    jti: string,
  ): Promise<{ jti: string; userId: string } | null> {
    return this.db.refreshToken.findUnique({
      where: { jti },
      select: { jti: true, userId: true },
    });
  }

  /**
   * Deletes a single JTI row (revoke one session).
   *
   * @remarks Uses `deleteMany` to avoid throwing when the row is already absent.
   * @param jti - UUID of the token to revoke
   */
  async deleteByJti(jti: string): Promise<void> {
    await this.db.refreshToken.deleteMany({ where: { jti } });
  }

  /**
   * Deletes all JTI rows for a user (revoke all sessions).
   *
   * @param userId - UUID of the user whose tokens should be revoked
   */
  async deleteByUserId(userId: string): Promise<void> {
    await this.db.refreshToken.deleteMany({ where: { userId } });
  }
}
