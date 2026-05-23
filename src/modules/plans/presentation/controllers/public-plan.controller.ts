import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';
import { PlanResponseDto } from '../../application/dtos';
import { PlanPresenter } from '../mappers/plan.presenter';
import { FindAllActivePlansUseCase } from '../../application/use-cases';

/**
 * Public catalogue of subscription plans (no authentication required).
 *
 * @remarks
 * Filters to `isActive = true` so unauthenticated visitors only see plans
 * available for new subscriptions. Used by the marketing site / signup flow.
 *
 * Base path: `/public/plans`
 */
@ApiTags('public')
@Controller('public/plans')
export class PublicPlanController {
  constructor(private readonly findAllActivePlans: FindAllActivePlansUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List active plans (public)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, type: PaginatedDto<PlanResponseDto> })
  async findAllActive(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<PlanResponseDto>> {
    const result = await this.findAllActivePlans.execute({ page, limit });
    return {
      ...result,
      data: PlanPresenter.toHTTPList(result.data),
    };
  }
}
