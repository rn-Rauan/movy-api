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

  @Post()
  @UseGuards(DevGuard)
  @Dev()
  @ApiOperation({ summary: 'Create a plan (dev only)' })
  @ApiResponse({ status: 201, type: PlanResponseDto })
  async create(@Body() dto: CreatePlanDto): Promise<PlanResponseDto> {
    return PlanPresenter.toHTTP(await this.createPlan.execute(dto));
  }

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
