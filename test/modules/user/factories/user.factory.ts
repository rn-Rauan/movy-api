import { User } from 'src/modules/user/domain/entities';
import {
  PasswordHash,
  UserName,
} from 'src/modules/user/domain/entities/value-objects';
import { Email } from 'src/shared/domain/entities/value-objects/email.value-object';
import { Telephone } from 'src/shared/domain/entities/value-objects/telephone.value-object';

interface UserFactoryOverrides {
  id?: string;
  name?: string;
  email?: string;
  passwordHash?: string;
  telephone?: string;
}

export function makeUser(overrides: UserFactoryOverrides = {}): User {
  return User.create({
    id: overrides.id ?? 'user-id-stub',
    name: UserName.create(overrides.name ?? 'Stub User'),
    email: Email.create(overrides.email ?? 'stub@email.com'),
    passwordHash: PasswordHash.create(overrides.passwordHash ?? 'hashed-stub'),
    telephone: Telephone.create(overrides.telephone ?? '9999999999'),
  });
}
