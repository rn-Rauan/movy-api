import { Injectable } from '@nestjs/common';
import { CreateUserUseCase } from '../../../user/application/use-cases';
import { CreateOrganizationUseCase } from '../../../organization/application/use-cases';
import { RegisterOrganizationWithAdminDto } from '../dtos/register-organization.dto';
import { TokenResponseDto } from '../dtos';
import { LoginUseCase } from './login.use-case';

@Injectable()
export class RegisterOrganizationUseCase {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  async execute(
    dto: RegisterOrganizationWithAdminDto,
  ): Promise<TokenResponseDto> {
    // 1. Create the User
    const user = await this.createUserUseCase.execute({
      name: dto.userName,
      email: dto.userEmail,
      password: dto.userPassword,
      telephone: dto.userTelephone,
    });

    // 2. Create the Organization (this also creates the ADMIN membership)
    await this.createOrganizationUseCase.execute(
      {
        name: dto.organizationName,
        cnpj: dto.cnpj,
        email: dto.organizationEmail,
        telephone: dto.organizationTelephone,
        address: dto.address,
        slug: dto.slug,
      },
      user.id,
    );

    // 3. Auto-login after registration
    return this.loginUseCase.execute({
      email: dto.userEmail,
      password: dto.userPassword,
    });
  }
}
