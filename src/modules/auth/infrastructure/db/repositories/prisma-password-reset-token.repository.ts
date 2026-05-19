import { Injectable } from '@nestjs/common';
import { PasswordResetToken } from 'src/modules/auth/domain/entities/password-reset-token.entity';
import { PasswordResetTokenRepository } from 'src/modules/auth/domain/interfaces/password-reset-token.repository';
import { DbContext } from 'src/shared/infrastructure/database/db-context';

/**
 * Prisma-backed implementation of {@link PasswordResetTokenRepository}.
 *
 * All I/O targets the `password_reset_token` table via `DbContext` (transaction-aware).
 */
@Injectable()
export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private readonly dbContext: DbContext) {}

  private get db() {
    return this.dbContext.client;
  }

  async save(token: PasswordResetToken): Promise<void> {
    await this.db.passwordResetToken.create({
      data: {
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        usedAt: token.usedAt,
        createdAt: token.createdAt,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const row = await this.db.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!row) return null;

    return PasswordResetToken.restore({
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.db.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
