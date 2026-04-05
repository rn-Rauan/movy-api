import { RoleName } from '../types/role-name.enum';

export interface RoleProps {
  readonly id: number;
  name: RoleName;
}

export class Role {
  private readonly props: RoleProps;

  private constructor(props: RoleProps) {
    this.props = props;
  }

  static create(props: RoleProps): Role {
    return new Role(props);
  }

  static restore(props: RoleProps): Role {
    return new Role(props);
  }

  get id(): number {
    return this.props.id;
  }

  get name(): RoleName {
    return this.props.name;
  }

  setName(name: RoleName): void {
    this.props.name = name;
  }
}
