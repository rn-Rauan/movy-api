import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from 'src/shared/domain/types/role-name.enum';

/**
 * @param id - Numeric ID of the role
 * @param name - Name of the role (e.g. ADMIN, DRIVER)
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
