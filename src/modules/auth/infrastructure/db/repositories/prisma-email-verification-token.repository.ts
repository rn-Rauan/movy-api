import { Injectable } from '@nestjs/common';
import { EmailVerificationToken } from 'src/modules/auth/domain/entities/email-verification-token.entity';
import { EmailVerificationTokenRepository } from 'src/modules/auth/domain/interfaces/email-verification-token.repository';
import { DbContext } from 'src/shared/infrastructure/database/db-context';

/**
 * Prisma-backed implementation of {@link EmailVerificationTokenRepository}.
 *
 * All I/O targets the `email_verification_token` table via `DbContext`.
 */
@Injectable()
export class PrismaEmailVerificationTokenRepository implements EmailVerificationTokenRepository {
  constructor(private readonly dbContext: DbContext) {}

  private get db() {
    return this.dbContext.client;
  }

  async save(token: EmailVerificationToken): Promise<void> {
    await this.db.emailVerificationToken.create({
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

  async findByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null> {
    const row = await this.db.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
    if (!row) return null;

    return EmailVerificationToken.restore({
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.db.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
