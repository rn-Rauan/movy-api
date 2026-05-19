import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Dev } from '../../infrastructure/decorators/dev.decorator';
import { DevGuard } from '../../infrastructure/guards/dev.guard';
import { JwtAuthGuard } from '../../infrastructure/guards/jwt.guard';
import {
  InMemoryEmailLog,
  SentEmailRecord,
} from '../../infrastructure/email/in-memory-email-log';

/**
 * Dev-only diagnostic endpoint that exposes the in-memory buffer of emails
 * "sent" by {@link ConsoleEmailService}.
 *
 * Used by the FE in dev mode to recover email-verification and password-reset
 * tokens without a real inbox. Restricted by `@Dev()` + {@link DevGuard}.
 *
 * Base path: `/dev/emails`.
 */
@ApiTags('dev')
@Controller('dev/emails')
@UseGuards(JwtAuthGuard, DevGuard)
@Dev()
export class DevEmailsController {
  constructor(private readonly emailLog: InMemoryEmailLog) {}

  @Get('latest')
  @ApiOperation({
    summary: '[DEV] Inspect emails recently captured by the in-memory mock',
    description:
      'Returns up to `limit` most recent emails, newest first. If `to` is ' +
      'provided, returns only the latest one to that recipient (wrapped in an array).',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Filter by recipient email',
  })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  latest(
    @Query('to') to: string | undefined,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): SentEmailRecord[] {
    if (to && to.trim().length > 0) {
      const latest = this.emailLog.findLatestByRecipient(to.trim());
      return latest ? [latest] : [];
    }
    return this.emailLog.latest(limit);
  }
}
