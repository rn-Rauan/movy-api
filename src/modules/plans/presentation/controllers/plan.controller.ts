import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/infrastructure/guards/jwt.guard';
import { DevGuard } from 'src/shared/infrastructure/guards/dev.guard';
import { Dev } from 'src/shared/infrastructure/decorators/dev.decorator';
import { PaginatedDto } from 'src/shared/presentation/dtos/paginated.dto';
import {
  CreatePlanDto,
  PlanResponseDto,
  UpdatePlanDto,
} from '../../application/dtos';
import { PlanPresenter } from '../mappers/plan.presenter';
import {
  CreatePlanUseCase,
  DeactivatePlanUseCase,
  FindAllPlansUseCase,
  FindPlanByIdUseCase,
  UpdatePlanUseCase,
} from '../../application/use-cases';

/**
 * HTTP controller for the Plans module.
 *
 * Write operations (create, update, deactivate) are protected by `DevGuard`
 * and are only available in non-production environments.
 * Read operations are accessible to all authenticated users via `JwtAuthGuard`.
 *
 * Base path: `/plans`
 */
@ApiTags('plans')
@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlanController {
  constructor(
    private readonly createPlan: CreatePlanUseCase,
    private readonly updatePlan: UpdatePlanUseCase,
    private readonly deactivatePlan: DeactivatePlanUseCase,
    private readonly findPlanById: FindPlanByIdUseCase,
    private readonly findAllPlans: FindAllPlansUseCase,
  ) {}

  /**
   * Creates a new plan. Restricted to development environments.
   *
   * @param dto - Validated input body for the new plan
   * @returns The created plan as a {@link PlanResponseDto}
   */
  @Post()
  @UseGuards(DevGuard)
  @Dev()
  @ApiOperation({ summary: 'Create a plan (dev only)' })
  @ApiResponse({ status: 201, type: PlanResponseDto })
  async create(@Body() dto: CreatePlanDto): Promise<PlanResponseDto> {
    return PlanPresenter.toHTTP(await this.createPlan.execute(dto));
  }

  /**
   * Updates the mutable fields of a plan (price and operational limits).
   * The `name` field is immutable and is excluded from the DTO. Restricted to development.
   *
   * @param id - Numeric `id` of the plan to update
   * @param dto - Partial update payload
   * @returns The updated plan as a {@link PlanResponseDto}
   */
  @Patch(':id')
  @UseGuards(DevGuard)
  @Dev()
  @ApiOperation({ summary: 'Update a plan (dev only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: PlanResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    return PlanPresenter.toHTTP(await this.updatePlan.execute(id, dto));
  }

  /**
   * Deactivates a plan, preventing new subscriptions. Restricted to development.
   * Does **not** cancel existing subscriptions.
   *
   * @param id - Numeric `id` of the plan to deactivate
   * @returns The deactivated plan as a {@link PlanResponseDto}
   */
  @Patch(':id/deactivate')
  @UseGuards(DevGuard)
  @Dev()
  @ApiOperation({ summary: 'Deactivate a plan (dev only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: PlanResponseDto })
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlanResponseDto> {
    return PlanPresenter.toHTTP(await this.deactivatePlan.execute(id));
  }

  /**
   * Returns a paginated list of all plans. Accessible to all authenticated users.
   *
   * @param page - Page number (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @returns A {@link PaginatedDto} containing {@link PlanResponseDto} items
   */
  @Get()
  @ApiOperation({ summary: 'List all plans' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, type: PaginatedDto<PlanResponseDto> })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedDto<PlanResponseDto>> {
    const result = await this.findAllPlans.execute({ page, limit });
    return {
      ...result,
      data: PlanPresenter.toHTTPList(result.data),
    } as PaginatedDto<PlanResponseDto>;
  }

  /**
   * Retrieves a single plan by its numeric primary key.
   *
   * @param id - Numeric `id` of the plan
   * @returns The matching plan as a {@link PlanResponseDto}
   */
  @Get(':id')
  @ApiOperation({ summary: 'Find a plan by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: PlanResponseDto })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlanResponseDto> {
    return PlanPresenter.toHTTP(await this.findPlanById.execute(id));
  }
}
