/**
 * Abstract repository contract for persisting refresh token JTIs.
 *
 * @remarks
 * Each refresh token carries a `jti` (JWT ID) UUID claim that uniquely identifies
 * the token. On login/refresh the JTI is stored here; on logout it is deleted.
 * {@link RefreshTokenUseCase} rejects any refresh token whose JTI is absent from
 * this store, enabling server-side session revocation without a full token blacklist.
 *
 * The concrete implementation ({@link PrismaRefreshTokenRepository}) is bound to
 * this token inside {@link AuthModule}.
 */
export abstract class RefreshTokenRepository {
  /**
   * Persists a new refresh token JTI for the given user.
   *
   * @param jti - UUID `jti` claim embedded in the signed refresh token
   * @param userId - UUID of the owning user
   * @param expiresAt - Absolute expiry date (must match the token's `exp` claim)
   */
  abstract save(jti: string, userId: string, expiresAt: Date): Promise<void>;

  /**
   * Retrieves a stored JTI record by its identifier.
   *
   * @param jti - UUID to look up
   * @returns The record if found, or `null` if revoked / never issued
   */
  abstract findByJti(
    jti: string,
  ): Promise<{ jti: string; userId: string } | null>;

  /**
   * Removes a single refresh token JTI (logout current session).
   *
   * @param jti - UUID of the token to revoke
   */
  abstract deleteByJti(jti: string): Promise<void>;

  /**
   * Removes all refresh token JTIs belonging to a user (logout all sessions).
   *
   * @param userId - UUID of the user whose sessions should be invalidated
   */
  abstract deleteByUserId(userId: string): Promise<void>;
}
