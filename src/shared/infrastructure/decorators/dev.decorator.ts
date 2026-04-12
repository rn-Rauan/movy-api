import { SetMetadata } from '@nestjs/common';

/**
 * Chave de metadata para o DevGuard
 */
export const DEV_ONLY_KEY = 'devOnly';

/**
 * Decorator que marca uma rota como acessível apenas para desenvolvedores.
 *
 * Devs são identificados pela flag isDev no JWT, que é definida
 * com base na whitelist de emails na variável de ambiente DEV_EMAILS.
 *
 * Uso:
 *   @UseGuards(JwtAuthGuard, DevGuard)
 *   @Dev()
 *   @Get('/admin/debug')
 *   async debugEndpoint() { ... }
 *
 * Também pode ser combinado com @Roles() no RolesGuard:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('ADMIN')
 *   @Dev()  // Devs TAMBÉM passam (bypass de roles)
 */
export const Dev = () => SetMetadata(DEV_ONLY_KEY, true);
