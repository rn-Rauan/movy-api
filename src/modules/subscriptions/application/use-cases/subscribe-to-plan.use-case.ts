import { Injectable } from '@nestjs/common';
import { PlanRepository } from 'src/modules/plans/domain/interfaces/plan.repository';
import { PlanNotFoundError } from 'src/modules/plans/domain/errors/plan.errors';
import { SubscriptionRepository } from '../../domain/interfaces/subscription.repository';
import { SubscriptionStatus } from '../../domain/interfaces/enums/subscription-status.enum';
import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import {
  SubscriptionAlreadyActiveError,
  SubscriptionCreationFailedError,
} from '../../domain/errors/subscription.errors';
import { CreateSubscriptionDto } from '../dtos';

const SUBSCRIPTION_DURATION_DAYS = 30;

@Injectable()
export class SubscribeToPlanUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
  ) {}

  async execute(dto: CreateSubscriptionDto, organizationId: string) {
    const plan = await this.planRepository.findById(dto.planId);
    if (!plan) {
      throw new PlanNotFoundError(dto.planId);
    }

    if (!plan.isActive) {
      throw new PlanNotFoundError(dto.planId);
    }

    const existing =
      await this.subscriptionRepository.findActiveByOrganizationId(
        organizationId,
        SubscriptionStatus.ACTIVE,
      );
    if (existing) {
      throw new SubscriptionAlreadyActiveError(organizationId);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SUBSCRIPTION_DURATION_DAYS);

    const subscription = SubscriptionEntity.create({
      organizationId,
      planId: dto.planId,
      expiresAt,
    });

    const saved = await this.subscriptionRepository.save(subscription);
    if (!saved) {
      throw new SubscriptionCreationFailedError();
    }

    return saved;
  }
}
