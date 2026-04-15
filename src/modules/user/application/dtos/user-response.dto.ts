import { ApiProperty } from '@nestjs/swagger';
import type { Status } from 'src/shared/domain/types/status.type';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '11999999999' })
  telephone: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] })
  status: Status;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(data: {
    id: string;
    name: string;
    email: string;
    telephone: string;
    status: Status;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.telephone = data.telephone;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
