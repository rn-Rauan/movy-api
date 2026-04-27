import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from 'src/shared/domain/types/role-name.enum';

/**
 * HTTP response shape for a role lookup.
 *
 * Returned by `GET /memberships/me/role/:organizationId`.
 */
export class RoleResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: RoleName, example: RoleName.DRIVER })
  name: RoleName;

  constructor(data: { id: number; name: RoleName }) {
    this.id = data.id;
    this.name = data.name;
  }
}
