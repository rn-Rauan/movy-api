import { ApiProperty } from '@nestjs/swagger';

/**
 * @param userId - UUID of the user associated with the membership
 * @param roleId - ID of the role assigned to the user within the organization
 * @param organizationId - UUID of the organization to which the membership belongs
 * @param assignedAt - Date when the membership was assigned
 * @param removedAt - Date when the membership was removed (null if still active)
 */
export class MembershipResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: 1 })
  roleId: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  organizationId: string;

  @ApiProperty()
  assignedAt: Date;

  @ApiProperty()
  removedAt: Date | null;

  constructor(data: {
    userId: string;
    roleId: number;
    organizationId: string;
    assignedAt: Date;
    removedAt: Date | null;
  }) {
    this.userId = data.userId;
    this.roleId = data.roleId;
    this.organizationId = data.organizationId;
    this.assignedAt = data.assignedAt;
    this.removedAt = data.removedAt;
  }
}
