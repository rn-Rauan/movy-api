import { Injectable } from '@nestjs/common';
import {
  PublicTripQueryService,
  PublicTripInstanceData,
} from '../../domain/interfaces';
import { TripInstanceNotFoundError } from '../../domain/entities/errors/trip-instance.errors';

@Injectable()
export class FindPublicTripInstanceByIdUseCase {
  constructor(
    private readonly publicTripQueryService: PublicTripQueryService,
  ) {}

  async execute(id: string): Promise<PublicTripInstanceData> {
    const data = await this.publicTripQueryService.findById(id);
    if (!data) throw new TripInstanceNotFoundError(id);
    return data;
  }
}
