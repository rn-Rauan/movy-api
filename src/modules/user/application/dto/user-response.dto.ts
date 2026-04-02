import { Status } from 'src/shared/domain/types/status.type';

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  telephone: string;
  status: Status;
  createdAt: Date;
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
