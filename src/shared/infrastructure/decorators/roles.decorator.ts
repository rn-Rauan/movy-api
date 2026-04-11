import { SetMetadata } from '@nestjs/common';
import { RoleName } from 'src/shared/domain/types/role-name.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
