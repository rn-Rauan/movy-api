import { ApiProperty } from '@nestjs/swagger';
import type { Status } from 'src/shared/domain/types/status.type';

export class OrganizationResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  id: string;

  @ApiProperty({ example: 'My Organization' })
  name: string;

  @ApiProperty({ example: '12345678000199' })
  cnpj: string;

  @ApiProperty({ example: 'contact@myorg.com' })
  email: string;

  @ApiProperty({ example: '11999999999' })
  telephone: string;

  @ApiProperty({ example: 'my-org' })
  slug: string;

  @ApiProperty({ example: 'Rua Exemplo, 123' })
  address: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] })
  status: Status;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(data: {
    id: string;
    name: string;
    cnpj: string;
    email: string;
    telephone: string;
    slug: string;
    address: string;
    status: Status;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.cnpj = data.cnpj;
    this.email = data.email;
    this.telephone = data.telephone;
    this.slug = data.slug;
    this.address = data.address;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
