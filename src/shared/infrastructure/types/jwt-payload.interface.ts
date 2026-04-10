/**
 * JwtPayload Interface
 *
 * Define a estrutura do payload do JWT após validação pelo JWT Strategy
 * Retornado por JwtStrategy.validate() e injetado automaticamente em req.user pelo Passport
 *
 * ✅ Propriedades:
 * - sub: Subject (userId - compatível com JWT standard)
 * - id: Alias para sub (para compatibilidade)
 * - email: Email do usuário
 * - organizationId: ID da organização (undefined para B2C)
 * - role: Role do usuário naquela organização
 * - isDev: Flag de desenvolvedor (whitelist)
 * - userStatus: Status do usuário no banco
 */
export interface JwtPayload {
  sub: string;
  id: string;
  email: string;
  organizationId?: string;
  role?: 'ADMIN' | 'DRIVER' | null;
  isDev: boolean;
  userStatus: string;
}

/**
 * Estender Express.Request para tipar corretamente req.user
 * após o Passport injetar o payload do JWT
 */
declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}
