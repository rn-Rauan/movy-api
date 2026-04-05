import { Role } from '../entities/role.entity';

export abstract class RoleRepository {
  abstract findById(id: number): Promise<Role | null>;
  abstract findByName(name: string): Promise<Role | null>;
}
