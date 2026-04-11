# 🚀 RBAC MVP - Simples e Funcional

**3 meses | TCC | MVP**

---

## ⚡ Resumo em 30 segundos

```
✅ Guards já funcionam (JWT, Roles, TenantFilter)
✅ Só precisa aplicar nos controllers
✅ Driver registration: ADMIN convida, DRIVER se registra
✅ 2-3 dias de implementação
```

---

## 📋 O Que Fazer (Na Ordem)

### 1. Criar DriverInvitation Table (2 horas)

**arquivo: `prisma/schema.prisma`**

```prisma
enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
}

model DriverInvitation {
  id              String    @id @default(uuid())
  organizationId  String
  email           String
  token           String    @unique
  status          InvitationStatus @default(PENDING)
  expiresAt       DateTime
  acceptedAt      DateTime?
  createdAt       DateTime  @default(now())

  organization    Organization @relation("DriverInvitations", fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@map("driver_invitation")
}
```

**Adicione na Organization:**
```prisma
driverInvitations DriverInvitation[] @relation("DriverInvitations")
```

**Execute:**
```bash
npx prisma migrate dev --name add_driver_invitation
```

---

### 2. Criar Use Cases (3 horas)

**arquivo: `src/modules/driver/application/use-cases/create-driver-invitation.use-case.ts`**

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { IDriverInvitationRepository } from '../../domain/interfaces/driver-invitation.repository';

@Injectable()
export class CreateDriverInvitationUseCase {
  constructor(private readonly repo: IDriverInvitationRepository) {}

  async execute(organizationId: string, email: string): Promise<{ token: string }> {
    // Validar que convite não existe
    const existing = await this.repo.findByOrgAndEmail(organizationId, email);
    if (existing?.status === 'PENDING') {
      throw new BadRequestException('Invitation already exists');
    }

    // Gerar token
    const token = Math.random().toString(36).substr(2) + 
                  Math.random().toString(36).substr(2);

    // Expiração: 7 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Criar
    await this.repo.create({
      organizationId,
      email,
      token,
      status: 'PENDING',
      expiresAt,
    });

    return { token };
  }
}
```

**arquivo: `src/modules/driver/application/use-cases/validate-driver-invitation.use-case.ts`**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IDriverInvitationRepository } from '../../domain/interfaces/driver-invitation.repository';

@Injectable()
export class ValidateDriverInvitationUseCase {
  constructor(private readonly repo: IDriverInvitationRepository) {}

  async execute(token: string): Promise<{ organizationId: string; email: string }> {
    const invitation = await this.repo.findByToken(token);

    if (!invitation) {
      throw new UnauthorizedException('Invalid token');
    }

    if (invitation.status !== 'PENDING' || new Date() > invitation.expiresAt) {
      throw new UnauthorizedException('Invitation expired');
    }

    return {
      organizationId: invitation.organizationId,
      email: invitation.email,
    };
  }
}
```

---

### 3. Adicionar Endpoint Auth (1 hora)

**arquivo: `src/modules/auth/presentation/controllers/auth.controller.ts`**

```typescript
@Post('register/invited')
async registerInvited(@Body() dto: RegisterInvitedDto): Promise<TokenResponseDto> {
  // Validar invitation
  const { organizationId, email } = await this.validateInvitationUseCase.execute(
    dto.token
  );

  // Verificar email bate
  if (dto.email !== email) {
    throw new BadRequestException('Email mismatch');
  }

  // Registrar user normalmente
  const result = await this.registerUseCase.execute({
    name: dto.name,
    email: dto.email,
    password: dto.password,
    telephone: dto.telephone || '',
  });

  // TODO: Criar Driver entry e Membership aqui automaticamente

  return result;
}
```

---

### 4. Aplicar Guards nos Controllers (4 horas)

**Pattern Simples:**

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { TenantFilterGuard } from 'src/shared/guards/tenant-filter.guard';
import { Roles } from 'src/shared/infrastructure/decorators/roles.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard)  // ← SEMPRE aqui
export class OrganizationController {
  
  // Admin só
  @UseGuards(RolesGuard, TenantFilterGuard)
  @Roles('ADMIN')
  @Put(':organizationId')
  update(@Param('organizationId') orgId: string) { }

  // Qualquer um autenticado
  @Get('me')
  getMy(@GetTenantContext() context: TenantContext) { }
}
```

**Controllers que precisam guards:**
- ✅ UserController (B2C) → só JWT
- ✅ OrganizationController (Admin) → JWT + ADMIN + TenantFilter
- ✅ MembershipController (Admin) → JWT + ADMIN + TenantFilter
- ⏳ VehicleController (novo) → JWT + ADMIN + TenantFilter
- ⏳ DriverController (novo) → JWT + ADMIN + TenantFilter (convites)
- ⏳ TripTemplateController (novo) → JWT + ADMIN + TenantFilter
- ⏳ TripInstanceController (novo) → JWT + ADMIN/DRIVER + TenantFilter
- ⏳ EnrollmentController (novo) → JWT (B2C) + ADMIN view

---

### 5. Testes Rápidos (1 hora)

```bash
# Dev acessa tudo
curl -H "Authorization: Bearer DEV_TOKEN" http://localhost:3000/organizations

# Admin acessa sua org
curl -H "Authorization: Bearer ADMIN_TOKEN" http://localhost:3000/organizations/org-123

# Admin tenta org diferente → 403
curl -H "Authorization: Bearer ADMIN_TOKEN" http://localhost:3000/organizations/org-456

# B2C user ve seu perfil
curl -H "Authorization: Bearer B2C_TOKEN" http://localhost:3000/users/me

# B2C user tenta admin area → 403
curl -H "Authorization: Bearer B2C_TOKEN" http://localhost:3000/organizations/org-123
```

---

## 🎯 Checklist MVP

### Database
- [ ] DriverInvitation table criada
- [ ] Migração executada

### Code
- [ ] Use cases implementados
- [ ] Auth endpoint adicionado
- [ ] Guards aplicados em controllers existentes

### Tests
- [ ] Dev access funciona
- [ ] Admin access funciona (sua org)
- [ ] Admin bloqueado (org diferente)
- [ ] B2C user bloqueado (org area)

---

## ⏱️ Timeline

```
Dia 1: DriverInvitation table + use cases (5 horas)
Dia 2: Auth endpoint + guards nos controllers (5 horas)
Dia 3: Testes + bug fixes (4 horas)

Total: 14 horas (1-2 dias de trabalho)
```

---

## 🔐 Segurança Garantida

```
✅ JWT Enrichment: role + organizationId + isDev
✅ JwtAuthGuard: valida token
✅ RolesGuard: valida @Roles()
✅ TenantFilterGuard: IDOR protection
✅ Multi-tenant: dados isolados por org
```

---

## 📝 Próximos Passos (Depois do MVP)

```
Fase 2 (Semana 2-3):
- Vehicle + Driver modules
- Trip Templates + Trip Instances
- Enrollment (bookings)

Fase 3 (Semana 4):
- Payments (Stripe)
- Plans/Subscription

Fase 4 (Semana 5+):
- Polishing
- Testes E2E
- Documentação TCC
```

---

**Pronto?** Comece pelo passo 1!
