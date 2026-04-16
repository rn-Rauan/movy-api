import { Role } from '../entities/role.entity';

export abstract class RoleRepository {
  /**
   * @param id - Numeric ID of the role
   * @returns Role entity or null if not found
   */
  abstract findById(id: number): Promise<Role | null>;
  /**
   * @param name - Name of the role (e.g. 'ADMIN', 'DRIVER')
   * @returns Role entity or null if not found
   */
  abstract findByName(name: string): Promise<Role | null>;
}
