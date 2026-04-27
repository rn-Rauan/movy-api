import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePlanDto } from './create-plan.dto';

/**
 * Input DTO for the `PATCH /plans/:id` endpoint.
 *
 * All fields are optional (via `PartialType`). The `name` field is intentionally
 * excluded because plan names are immutable after creation.
 *
 * @remarks
 * This operation is restricted to development environments and protected by `DevGuard`.
 */
export class UpdatePlanDto extends PartialType(
  OmitType(CreatePlanDto, ['name'] as const),
) {}
