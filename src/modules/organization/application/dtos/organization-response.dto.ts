import { ApiProperty } from '@nestjs/swagger';
import type { Status } from 'src/shared/domain/types/status.type';

/**
 * DTO for organization response with public data.
 * @param id - Unique identifier (UUID v4)
 * @param name - Organization name
 * @param cnpj - Unique CNPJ number for the organization
 * @param email - Email contact
 * @param telephone - Contact telephone
 * @param slug - URL slug for the organization's URL
 * @param address - Organization address
 * @param status - Current status (ACTIVE | INACTIVE)
 * @param createdAt - Creation date
 * @param updatedAt - Last update date
 */
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
