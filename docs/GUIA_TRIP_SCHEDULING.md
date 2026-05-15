# Guia de Implementação — Hora no Template + Crons de Geração e Auto-Cancel

> Companion do plano em `~/.claude/plans/ok-bom-primeiro-voce-floofy-floyd.md`. Este arquivo é o **passo-a-passo executável**: comandos prontos, snippets para copiar, checklist por fase.

## Sumário

1. [Pré-requisitos](#0-pré-requisitos)
2. [Fase 1 — Hora-do-dia no `TripTemplate`](#fase-1--hora-do-dia-no-triptemplate)
3. [Fase 2 — `TripSchedulingConfig` (módulo novo)](#fase-2--tripschedulingconfig-módulo-novo)
4. [Fase 3 — Cron de auto-cancel](#fase-3--cron-de-auto-cancel)
5. [Fase 4 — Cron de geração de instâncias recorrentes](#fase-4--cron-de-geração-de-instâncias-recorrentes)
6. [Fase 5 — Botão manual de geração](#fase-5--botão-manual-de-geração)
7. [Troubleshooting](#troubleshooting)

---

## 0. Pré-requisitos

### Instalação

```bash
npm install @nestjs/schedule cron-parser
```

### Validação inicial

```bash
npx tsc --noEmit                             # baseline limpo
npx jest --config test/jest-unit.json        # baseline verde
git checkout -b feat/trip-scheduling          # branch dedicada
```

### Regra de ouro a cada commit

Antes de commitar qualquer fase:

```bash
npx tsc --noEmit
npx jest --config test/jest-unit.json
npm run lint
```

---

## Fase 1 — Hora-do-dia no `TripTemplate`

**Objetivo:** template armazena `HH:mm`; instância só recebe `departureDate`.

### Checklist

- [ ] 1.1 Schema Prisma + migration
- [ ] 1.2 Helper `combine-date-and-time.ts`
- [ ] 1.3 Erros de domínio novos
- [ ] 1.4 Entity `TripTemplate` (props, validação, método update)
- [ ] 1.5 DTOs (create, update, response template) + DTO instance
- [ ] 1.6 Use cases (create-template, update-template, create-instance)
- [ ] 1.7 Mapper Prisma
- [ ] 1.8 Presenter
- [ ] 1.9 Factories de teste
- [ ] 1.10 Specs atualizadas + novos casos
- [ ] 1.11 `tsc --noEmit` + testes verdes

### 1.1 Schema Prisma

Em `prisma/schema.prisma`, no model `TripTemplate`:

```prisma
model TripTemplate {
  // ... campos existentes
  departureTimeOfDay  String?  // 'HH:mm' — nullable pra migration suave; entity exige no create()
  arrivalTimeOfDay    String?  // 'HH:mm'
  // ...
}
```

Rodar:

```bash
npx prisma migrate dev --name add_time_of_day_to_trip_template
```

### 1.2 Helper de combinação

Criar `src/modules/trip/domain/utils/combine-date-and-time.ts`:

```ts
const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeOfDay(value: string): boolean {
  return HHMM_REGEX.test(value);
}

export function timeOfDayToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Combina uma data YYYY-MM-DD com hora HH:mm em um Date UTC.
 * Se `addDay` true, soma 24h (caso arrival cruze a meia-noite).
 */
export function combineDateAndTime(
  dateISO: string,
  timeHHmm: string,
  addDay = false,
): Date {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [hh, mm] = timeHHmm.split(':').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d, hh, mm, 0, 0));
  if (addDay) base.setUTCDate(base.getUTCDate() + 1);
  return base;
}

export function arrivalCrossesMidnight(
  departureHHmm: string,
  arrivalHHmm: string,
): boolean {
  return timeOfDayToMinutes(arrivalHHmm) <= timeOfDayToMinutes(departureHHmm);
}
```

### 1.3 Erros novos

Em `src/modules/trip/domain/entities/errors/trip-template.errors.ts`, adicionar:

```ts
export class InvalidTripTimeOfDayFormatError extends DomainError {
  constructor(field: string, value: string) {
    super(
      `Invalid time-of-day format for "${field}": "${value}". Expected HH:mm.`,
      'INVALID_TRIP_TIME_OF_DAY_FORMAT_BAD_REQUEST',
    );
  }
}

export class InvalidTripTimeOfDayOrderError extends DomainError {
  constructor() {
    super(
      'arrivalTimeOfDay must be different from departureTimeOfDay.',
      'INVALID_TRIP_TIME_OF_DAY_ORDER_BAD_REQUEST',
    );
  }
}

export class TripTemplateMissingScheduleError extends DomainError {
  constructor(templateId: string) {
    super(
      `Trip template ${templateId} is missing departureTimeOfDay/arrivalTimeOfDay.`,
      'TRIP_TEMPLATE_MISSING_SCHEDULE_BAD_REQUEST',
    );
  }
}
```

> Confirme o caminho do `DomainError` base na primeira linha do arquivo (mesmo padrão dos outros erros lá).

### 1.4 Entity `TripTemplate`

Em `src/modules/trip/domain/entities/trip-template.entity.ts`:

1. Adicionar nos `TripTemplateProps`:
   ```ts
   departureTimeOfDay?: string | null;
   arrivalTimeOfDay?: string | null;
   ```

2. No `TripTemplateState`:
   ```ts
   departureTimeOfDay: string | null;
   arrivalTimeOfDay: string | null;
   ```

3. No `private constructor`, dentro do spread:
   ```ts
   departureTimeOfDay: props.departureTimeOfDay ?? null,
   arrivalTimeOfDay: props.arrivalTimeOfDay ?? null,
   ```

4. No `static create(...)`, adicionar validação antes do `return`:
   ```ts
   if (!props.departureTimeOfDay || !props.arrivalTimeOfDay) {
     throw new RequiredFieldError('departureTimeOfDay/arrivalTimeOfDay');
   }
   TripTemplate.validateSchedule(props.departureTimeOfDay, props.arrivalTimeOfDay);
   ```

5. Adicionar o método estático:
   ```ts
   private static validateSchedule(departure: string, arrival: string): void {
     if (!isValidTimeOfDay(departure)) {
       throw new InvalidTripTimeOfDayFormatError('departureTimeOfDay', departure);
     }
     if (!isValidTimeOfDay(arrival)) {
       throw new InvalidTripTimeOfDayFormatError('arrivalTimeOfDay', arrival);
     }
     if (timeOfDayToMinutes(departure) === timeOfDayToMinutes(arrival)) {
       throw new InvalidTripTimeOfDayOrderError();
     }
   }
   ```

6. Getters:
   ```ts
   get departureTimeOfDay(): string | null { return this.props.departureTimeOfDay; }
   get arrivalTimeOfDay(): string | null   { return this.props.arrivalTimeOfDay; }
   ```

7. Método de update:
   ```ts
   updateSchedule(departure: string, arrival: string): void {
     TripTemplate.validateSchedule(departure, arrival);
     this.props.departureTimeOfDay = departure;
     this.props.arrivalTimeOfDay = arrival;
     this.props.updatedAt = new Date();
   }
   ```

### 1.5 DTOs

**`create-trip-template.dto.ts`** — adicionar:

```ts
@IsString()
@Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'departureTimeOfDay must be HH:mm' })
departureTimeOfDay!: string;

@IsString()
@Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'arrivalTimeOfDay must be HH:mm' })
arrivalTimeOfDay!: string;
```

**`update-trip-template.dto.ts`** — mesmos campos, marcados `@IsOptional()`.

**`trip-template-response.dto.ts`** — adicionar `departureTimeOfDay` e `arrivalTimeOfDay` como `string | null`.

**`create-trip-instance.dto.ts`** — REMOVER `departureTime` e `arrivalEstimate`, ADICIONAR:

```ts
@IsDateString()
departureDate!: string;  // 'YYYY-MM-DD'
```

### 1.6 Use cases

**`create-trip-template.use-case.ts`** — passar `departureTimeOfDay` e `arrivalTimeOfDay` no `TripTemplate.create({ ... })`.

**`update-trip-template.use-case.ts`** — se a DTO tiver os dois campos, chamar `template.updateSchedule(...)` antes de salvar.

**`create-trip-instance.use-case.ts`** — substituir o trecho que monta `departureTime`/`arrivalEstimate`:

```ts
if (!freshTemplate.departureTimeOfDay || !freshTemplate.arrivalTimeOfDay) {
  throw new TripTemplateMissingScheduleError(freshTemplate.id);
}

const departureTime = combineDateAndTime(
  input.departureDate,
  freshTemplate.departureTimeOfDay,
);

const crossesMidnight = arrivalCrossesMidnight(
  freshTemplate.departureTimeOfDay,
  freshTemplate.arrivalTimeOfDay,
);

const arrivalEstimate = combineDateAndTime(
  input.departureDate,
  freshTemplate.arrivalTimeOfDay,
  crossesMidnight,
);
```

### 1.7 Mapper Prisma

Em `src/modules/trip/infrastructure/db/mappers/trip-template.mapper.ts`:

- **`toDomain`**: incluir `departureTimeOfDay: raw.departureTimeOfDay` e `arrivalTimeOfDay: raw.arrivalTimeOfDay`.
- **`toPersistence`**: incluir os dois no objeto de retorno.

### 1.8 Presenter

`src/modules/trip/presentation/mappers/trip-template.presenter.ts` — incluir no `toHTTP`:

```ts
departureTimeOfDay: template.departureTimeOfDay,
arrivalTimeOfDay: template.arrivalTimeOfDay,
```

### 1.9 Factories

`test/modules/trip/factories/trip-template.factory.ts` — adicionar defaults `'07:30'` e `'08:30'` (ou similar).

### 1.10 Specs

Atualizar:
- `create-trip-template.use-case.spec.ts` — happy path + formato inválido + arrival == departure.
- `update-trip-template.use-case.spec.ts` — update do schedule.
- `create-trip-instance.use-case.spec.ts` — happy path com `departureDate`, template sem schedule, cruzando meia-noite.

### 1.11 Validação final

```bash
npx tsc --noEmit
npx jest --config test/jest-unit.json
npm run lint
```

Manual:

```bash
# subir API
docker-compose up postgres -d
npm run start:dev

# em outro terminal: criar template via swagger ou curl
# POST /organizations/<id>/trip-templates com departureTimeOfDay: '07:30', arrivalTimeOfDay: '08:30'
# POST /organizations/<id>/trip-instances com departureDate: '2026-05-20'
# Verificar no banco: departureTime = 2026-05-20T07:30:00Z, arrivalEstimate = 2026-05-20T08:30:00Z
```

Commit:

```bash
git add -A
git commit -m "feat(trip): store time-of-day in TripTemplate; instance derives datetime from date + template"
```

---

## Fase 2 — `TripSchedulingConfig` (módulo novo)

**Objetivo:** cada org tem um registro com `daysAhead` e (futuro) crons customizados.

### Checklist

- [ ] 2.1 Schema Prisma + migration
- [ ] 2.2 Estrutura do módulo
- [ ] 2.3 Entity + erros
- [ ] 2.4 Repository interface + Prisma impl
- [ ] 2.5 Use cases (find, update)
- [ ] 2.6 DTOs + presenter
- [ ] 2.7 Controller
- [ ] 2.8 Wiring no module + `app.module.ts`
- [ ] 2.9 Auto-criação no signup da org
- [ ] 2.10 Specs

### 2.1 Schema

```prisma
model TripSchedulingConfig {
  id              String       @id @default(uuid())
  organizationId  String       @unique
  daysAhead       Int          @default(14)
  generationCron  String       @default("0 2 * * *")
  autoCancelCron  String       @default("*/15 * * * *")
  enabled         Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
}
```

E no `Organization` adicionar a relação inversa:

```prisma
schedulingConfig TripSchedulingConfig?
```

```bash
npx prisma migrate dev --name add_trip_scheduling_config
```

### 2.2 Árvore

```
src/modules/scheduling/
├── application/
│   ├── dtos/
│   │   └── update-trip-scheduling-config.dto.ts
│   └── use-cases/
│       ├── find-trip-scheduling-config.use-case.ts
│       ├── update-trip-scheduling-config.use-case.ts
│       └── index.ts
├── domain/
│   ├── entities/
│   │   ├── trip-scheduling-config.entity.ts
│   │   └── errors/
│   │       └── trip-scheduling-config.errors.ts
│   └── interfaces/
│       └── trip-scheduling-config.repository.ts
├── infrastructure/
│   └── db/
│       ├── mappers/
│       │   └── trip-scheduling-config.mapper.ts
│       └── repositories/
│           └── prisma-trip-scheduling-config.repository.ts
├── presentation/
│   ├── controllers/
│   │   └── trip-scheduling-config.controller.ts
│   └── mappers/
│       └── trip-scheduling-config.presenter.ts
└── scheduling.module.ts
```

### 2.3 Entity (esqueleto)

```ts
export class TripSchedulingConfig {
  private constructor(private readonly props: TripSchedulingConfigState) {}

  static create(input: { organizationId: string }): TripSchedulingConfig { /* defaults */ }
  static restore(props: TripSchedulingConfigProps): TripSchedulingConfig { /* */ }

  private static validateDaysAhead(value: number): void {
    if (!Number.isInteger(value) || value < 1 || value > 90) {
      throw new InvalidSchedulingDaysAheadError(value);
    }
  }

  private static validateCron(field: string, expr: string): void {
    try {
      CronExpressionParser.parse(expr);   // de 'cron-parser'
    } catch {
      throw new InvalidSchedulingCronError(field, expr);
    }
  }

  updateDaysAhead(value: number): void { /* validate + set */ }
  updateCrons(generation?: string, autoCancel?: string): void { /* */ }
  setEnabled(value: boolean): void { /* */ }
  // getters: organizationId, daysAhead, generationCron, autoCancelCron, enabled
}
```

### 2.4 Repository interface

```ts
export abstract class TripSchedulingConfigRepository {
  abstract save(config: TripSchedulingConfig): Promise<TripSchedulingConfig>;
  abstract findByOrganizationId(organizationId: string): Promise<TripSchedulingConfig | null>;
  abstract update(config: TripSchedulingConfig): Promise<TripSchedulingConfig>;
}
```

Implementação Prisma — espelhar padrão dos outros repos.

### 2.7 Controller

```ts
@Controller('organizations/:organizationId/scheduling-config')
@UseGuards(JwtAuthGuard, TenantFilterGuard, RolesGuard)
@Roles(RoleName.ADMIN)
export class TripSchedulingConfigController {
  constructor(
    private readonly findUseCase: FindTripSchedulingConfigUseCase,
    private readonly updateUseCase: UpdateTripSchedulingConfigUseCase,
  ) {}

  @Get()
  async find(@Param('organizationId') orgId: string) {
    const config = await this.findUseCase.execute(orgId);
    return TripSchedulingConfigPresenter.toHTTP(config);
  }

  @Patch()
  async update(
    @Param('organizationId') orgId: string,
    @Body() body: UpdateTripSchedulingConfigDto,
  ) {
    const config = await this.updateUseCase.execute(orgId, body);
    return TripSchedulingConfigPresenter.toHTTP(config);
  }
}
```

### 2.9 Auto-criação no signup

Em `src/modules/organization/application/use-cases/register-organization-with-admin.use-case.ts`, depois do `auto-subscribe FREE`:

```ts
const schedulingConfig = TripSchedulingConfig.create({ organizationId: org.id });
await this.tripSchedulingConfigRepository.save(schedulingConfig);
```

Adicionar import no módulo `organization` e injetar o repo (requer `SchedulingModule` no `imports`).

### 2.10 Specs

- Entity: validações `daysAhead` (limites), cron inválido, defaults no `create`.
- `update-trip-scheduling-config.use-case.spec.ts`: happy + cada validation path.

Commit:

```bash
git add -A
git commit -m "feat(scheduling): add TripSchedulingConfig per organization with CRUD endpoints"
```

---

## Fase 3 — Cron de auto-cancel

**Objetivo:** instâncias com `autoCancelAt` passado e status aberto viram `CANCELED`.

### Checklist

- [ ] 3.1 `ScheduleModule.forRoot()` no `app.module.ts`
- [ ] 3.2 Novo método em `TripInstanceRepository.findExpiredOpenInstances`
- [ ] 3.3 `OrganizationRepository.findAllActive` (se ainda não existir)
- [ ] 3.4 Use-case `cancel-expired-trip-instances.use-case.ts`
- [ ] 3.5 Cron class `auto-cancel.cron.ts`
- [ ] 3.6 Registrar no `trip.module.ts`
- [ ] 3.7 Specs do use-case

### 3.1 Registrar Schedule

`src/app.module.ts`:

```ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ...
  ],
})
export class AppModule {}
```

### 3.2 Novo método no repo

Interface:

```ts
abstract findExpiredOpenInstances(
  organizationId: string,
  threshold: Date,
): Promise<TripInstance[]>;
```

Implementação Prisma:

```ts
async findExpiredOpenInstances(organizationId: string, threshold: Date) {
  const rows = await this.prisma.tripInstance.findMany({
    where: {
      organizationId,
      autoCancelAt: { lte: threshold, not: null },
      tripStatus: { in: ['DRAFT', 'SCHEDULED', 'CONFIRMED'] },
      forceConfirm: false,
    },
  });
  return rows.map(TripInstanceMapper.toDomain);
}
```

### 3.4 Use-case

`src/modules/trip/application/use-cases/cancel-expired-trip-instances.use-case.ts`:

```ts
@Injectable()
export class CancelExpiredTripInstancesUseCase {
  private readonly logger = new Logger(CancelExpiredTripInstancesUseCase.name);

  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(): Promise<{ canceled: number; failed: number }> {
    const now = new Date();
    const orgs = await this.organizationRepository.findAllActive();
    let canceled = 0;
    let failed = 0;

    for (const org of orgs) {
      const instances = await this.tripInstanceRepository.findExpiredOpenInstances(
        org.id,
        now,
      );
      for (const instance of instances) {
        try {
          instance.transitionTo(TripStatus.CANCELED);
          await this.tripInstanceRepository.update(instance);
          canceled++;
        } catch (err) {
          failed++;
          this.logger.error(
            `Failed to auto-cancel instance ${instance.id}: ${err}`,
          );
        }
      }
    }

    this.logger.log(`Auto-cancel run: canceled=${canceled}, failed=${failed}`);
    return { canceled, failed };
  }
}
```

> **Nota:** MVP ignora `minRevenue` — cancela toda instância expirada não-`forceConfirm`. Documentar isso no JSDoc da classe como tech-debt.

### 3.5 Cron class

`src/modules/trip/infrastructure/cron/auto-cancel.cron.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CancelExpiredTripInstancesUseCase } from '../../application/use-cases/cancel-expired-trip-instances.use-case';

@Injectable()
export class AutoCancelTripInstancesCron {
  constructor(private readonly useCase: CancelExpiredTripInstancesUseCase) {}

  @Cron('*/15 * * * *')
  async handle(): Promise<void> {
    await this.useCase.execute();
  }
}
```

### 3.6 Wiring

Em `trip.module.ts`, adicionar nos `providers`:

```ts
CancelExpiredTripInstancesUseCase,
AutoCancelTripInstancesCron,
```

E garantir que `OrganizationModule` esteja nos `imports` (ou exportar `OrganizationRepository`).

### 3.7 Specs

`test/modules/trip/application/use-cases/cancel-expired-trip-instances.use-case.spec.ts`:

- 0 orgs ativas → 0 canceladas.
- 1 org, 0 expiradas → 0.
- 1 org, 3 expiradas → 3 canceladas + `transitionTo(CANCELED)` chamado para cada.
- Falha em uma → não para o loop, contador `failed` incrementa.

Commit:

```bash
git add -A
git commit -m "feat(trip): auto-cancel cron for expired open trip instances"
```

---

## Fase 4 — Cron de geração de instâncias recorrentes

**Objetivo:** cron diário cria instâncias `DRAFT` para os próximos `daysAhead` dias.

### Checklist

- [ ] 4.1 Helper `day-of-week-mapping.ts`
- [ ] 4.2 Novos métodos repo (`findActiveRecurringByOrgId`, `findByTemplateAndDate`)
- [ ] 4.3 Use-case `generate-recurring-trip-instances.use-case.ts`
- [ ] 4.4 Cron class `generate-instances.cron.ts`
- [ ] 4.5 Wiring
- [ ] 4.6 Specs

### 4.1 Mapeamento dia-da-semana

`src/modules/trip/domain/utils/day-of-week-mapping.ts`:

```ts
import { DayOfWeek } from '../interfaces/enums/day-of-week.enum';

const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

export function dayOfWeekFromDate(d: Date): DayOfWeek {
  return JS_DAY_TO_ENUM[d.getUTCDay()];
}
```

> **Atenção TZ:** uso `getUTCDay()` propositalmente. `combineDateAndTime` cria datas em UTC. Documentar no commit.

### 4.2 Métodos novos

`TripTemplateRepository`:

```ts
abstract findActiveRecurringByOrgId(organizationId: string): Promise<TripTemplate[]>;
```

Impl: `WHERE organizationId=? AND status='ACTIVE' AND isRecurring=true`.

`TripInstanceRepository`:

```ts
abstract findByTemplateAndDate(
  templateId: string,
  date: Date,
): Promise<TripInstance | null>;
```

Impl: dia → range `[00:00:00 UTC, +24h)` filtrando por `tripTemplateId` + `departureTime BETWEEN`.

### 4.3 Use-case

`src/modules/trip/application/use-cases/generate-recurring-trip-instances.use-case.ts`:

```ts
export interface GenerateRecurringInput {
  organizationId?: string;   // se null, roda todas
  templateId?: string;        // se setado, filtra dentro da org
  daysAhead?: number;          // override do config (clamp 1-90)
}

export interface GenerateRecurringResult {
  generated: number;
  skipped: { reason: string; count: number }[];
}

@Injectable()
export class GenerateRecurringTripInstancesUseCase {
  private readonly logger = new Logger(GenerateRecurringTripInstancesUseCase.name);

  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly tripTemplateRepository: TripTemplateRepository,
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly schedulingConfigRepository: TripSchedulingConfigRepository,
    private readonly planLimitService: PlanLimitService,
  ) {}

  async execute(input: GenerateRecurringInput = {}): Promise<GenerateRecurringResult> {
    const orgs = input.organizationId
      ? [await this.organizationRepository.findById(input.organizationId)].filter(Boolean)
      : await this.organizationRepository.findAllActive();

    let generated = 0;
    const skipped: Record<string, number> = {};
    const bump = (k: string) => { skipped[k] = (skipped[k] ?? 0) + 1; };
    const now = new Date();

    for (const org of orgs) {
      const config = (await this.schedulingConfigRepository.findByOrganizationId(org.id))
        ?? null;
      if (config && !config.enabled) { bump('config_disabled'); continue; }

      const daysAhead = Math.min(
        Math.max(input.daysAhead ?? config?.daysAhead ?? 14, 1),
        90,
      );

      let templates = await this.tripTemplateRepository.findActiveRecurringByOrgId(org.id);
      if (input.templateId) {
        templates = templates.filter(t => t.id === input.templateId);
      }

      for (const template of templates) {
        if (!template.departureTimeOfDay || !template.arrivalTimeOfDay) {
          bump('missing_schedule');
          continue;
        }
        const crossesMidnight = arrivalCrossesMidnight(
          template.departureTimeOfDay,
          template.arrivalTimeOfDay,
        );

        let hitLimit = false;
        for (let offset = 0; offset <= daysAhead && !hitLimit; offset++) {
          const date = new Date(now);
          date.setUTCDate(date.getUTCDate() + offset);
          const dateISO = date.toISOString().slice(0, 10);

          if (!template.frequency.includes(dayOfWeekFromDate(date))) {
            continue;
          }

          const departureTime = combineDateAndTime(dateISO, template.departureTimeOfDay);
          if (departureTime < now) { bump('in_past'); continue; }

          const existing = await this.tripInstanceRepository.findByTemplateAndDate(
            template.id,
            date,
          );
          if (existing) { bump('already_exists'); continue; }

          // plan limit
          const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
          const monthlyCount = await this.tripInstanceRepository
            .countByOrganizationAndMonth(org.id, monthStart, now);
          try {
            await this.planLimitService.assertMonthlyTripLimit(org.id, monthlyCount);
          } catch {
            bump('plan_limit'); hitLimit = true; break;
          }

          const arrivalEstimate = combineDateAndTime(
            dateISO,
            template.arrivalTimeOfDay,
            crossesMidnight,
          );

          const autoCancelAt = template.autoCancelEnabled && template.autoCancelOffset
            ? new Date(departureTime.getTime() - template.autoCancelOffset * 60_000)
            : null;

          const instance = TripInstance.create({
            id: randomUUID(),
            organizationId: org.id,
            tripTemplateId: template.id,
            driverId: null,
            vehicleId: null,
            totalCapacity: 1, // TODO: definir default ou exigir no template (decisão futura)
            isPublic: template.isPublic,
            departureTime,
            arrivalEstimate,
            minRevenue: template.minRevenue,
            autoCancelAt,
          });
          await this.tripInstanceRepository.save(instance);
          generated++;
        }
      }
    }

    return {
      generated,
      skipped: Object.entries(skipped).map(([reason, count]) => ({ reason, count })),
    };
  }
}
```

> **Decisão pendente:** `totalCapacity` default vem de onde? Hoje vem da DTO da instância. Opções: (a) adicionar `defaultCapacity` ao `TripTemplate` (precisa mais 1 migration), (b) chumbar default `0` e admin atualiza manualmente, (c) usar capacity do veículo se houver. Recomendo (a) — migrar `defaultCapacity Int @default(0)` ao template. Decidir na hora.

### 4.4 Cron class

`src/modules/trip/infrastructure/cron/generate-instances.cron.ts`:

```ts
@Injectable()
export class GenerateRecurringInstancesCron {
  constructor(private readonly useCase: GenerateRecurringTripInstancesUseCase) {}

  @Cron('0 2 * * *')   // todo dia às 02:00
  async handle(): Promise<void> {
    await this.useCase.execute({});
  }
}
```

### 4.6 Specs

- Sem orgs ativas → `{ generated: 0 }`.
- Template sem `timeOfDay` → `skipped: [{ reason: 'missing_schedule' }]`.
- Idempotência: 2 execuções consecutivas — segunda gera 0.
- Plan limit atingido → `skipped: [{ reason: 'plan_limit' }]`.
- `frequency: [TUESDAY, THURSDAY]`, `daysAhead: 14` → 4 instâncias (aprox, depende da data).
- `departureTime < now` → skip.

Commit:

```bash
git add -A
git commit -m "feat(trip): cron-driven generation of recurring trip instances"
```

---

## Fase 5 — Botão manual de geração

**Objetivo:** admin dispara geração on-demand para um template.

### Checklist

- [ ] 5.1 Endpoint
- [ ] 5.2 DTO de body
- [ ] 5.3 Spec

### 5.1 Endpoint

Adicionar método em `trip-template.controller.ts`:

```ts
@Post(':templateId/generate-instances')
@UseGuards(JwtAuthGuard, TenantFilterGuard, RolesGuard)
@Roles(RoleName.ADMIN)
async generate(
  @Param('organizationId') orgId: string,
  @Param('templateId') templateId: string,
  @Body() body: GenerateInstancesDto,
) {
  return this.generateUseCase.execute({
    organizationId: orgId,
    templateId,
    daysAhead: body.daysAhead,
  });
}
```

### 5.2 DTO

```ts
export class GenerateInstancesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  daysAhead?: number;
}
```

### 5.3 Spec

E2E ou unit do controller verificando que `GenerateRecurringTripInstancesUseCase.execute` é chamado com `templateId` correto.

Commit:

```bash
git add -A
git commit -m "feat(trip): admin endpoint to manually generate instances from a template"
```

---

## Troubleshooting

### `npx prisma migrate dev` reclamando de dados existentes

Em dev: `npx prisma migrate reset` zera o banco. Em algo "mais real": rode `prisma migrate dev --create-only`, edite o SQL para adicionar `DEFAULT '08:00'` no `departureTimeOfDay` durante a migration, aplique, depois remova o default em uma 2ª migration. Pro MVP, reset é o caminho.

### Cron dispara durante `start:dev`

Esperado — `ScheduleModule` ativa em qualquer ambiente. Pra desativar localmente, condicionar por env:

```ts
ScheduleModule.forRoot({ /* sem opção de disable... */ }),
```

Alternativa: registrar `ScheduleModule` apenas em produção:

```ts
imports: [
  ...(process.env.DISABLE_CRON === 'true' ? [] : [ScheduleModule.forRoot()]),
]
```

E setar `DISABLE_CRON=true` no `.env` de dev quando incomodar.

### Cron rodando 2× em produção

Se subir múltiplas réplicas, ambos disparam. Mitigação MVP:
- Confiar nas chaves de unicidade (`findByTemplateAndDate` antes do save) e no state machine (`transitionTo` rejeita já-cancelado).
- Pós-MVP: usar `nestjs-cron-distributed-lock` ou hospedar cron num worker dedicado.

### Time zone confuso

O sistema todo armazena UTC. Ao usar `getUTCDay()` no `dayOfWeekFromDate`, garanta que o "dia" calculado bate com o que o usuário espera. Se a org operar em BRT (UTC-3), um trip às `00:30 UTC` na segunda é `21:30 BRT` no domingo — e o domingo é o dayOfWeek pro usuário. Pro MVP brasileiro: documentar que hora-do-dia no template é em **UTC** e front converte ou aceitar o trade-off. Decidir antes da Fase 1.

### `tsc --noEmit` pega circular import depois do scheduling.module.ts

`OrganizationModule` imports `SchedulingModule` (pra signup auto-criar config) e `SchedulingModule` lê org via repo. Se virar circular: `SchedulingModule` depende só de `PrismaService`, não de `OrganizationModule`. O signup chama `tripSchedulingConfigRepository.save()` diretamente — não precisa de use-case do scheduling.

---

## Apêndice — Comandos úteis

```bash
# Forçar execução manual do cron (útil em dev) — criar endpoint admin temporário:
# POST /admin/cron/auto-cancel  → this.cancelExpiredUseCase.execute()
# POST /admin/cron/generate     → this.generateUseCase.execute({})

# Inspecionar instâncias geradas
npx prisma studio
# → TripInstance: filtrar tripTemplateId, ordenar departureTime asc

# Forçar uma instância como "expirada" para testar auto-cancel
UPDATE "TripInstance" SET "autoCancelAt" = NOW() - INTERVAL '1 hour' WHERE id = '<uuid>';

# Conferir cron registrado
# Procurar no log de boot: "AutoCancelTripInstancesCron" e "GenerateRecurringInstancesCron"
```
