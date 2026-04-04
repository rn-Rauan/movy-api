import { Status } from "src/shared/domain/types/status.type";

export class OrganizationResponseDto {
  id: string;
  name: string;
  cnpj: string;
  slug: string;
  address: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    id: string;
    name: string;
    cnpj: string;
    slug: string;
    address: string;
    status: Status;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.cnpj = data.cnpj;
    this.slug = data.slug;
    this.address = data.address;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
