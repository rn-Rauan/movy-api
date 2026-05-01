import { Injectable } from '@nestjs/common';
import {
  PublicTripQueryService,
  PublicTripInstanceData,
} from '../../domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';

@Injectable()
export class FindPublicTripInstancesByOrgSlugUseCase {
  constructor(
    private readonly publicTripQueryService: PublicTripQueryService,
  ) {}

  async execute(
    options: PaginationOptions,
    slug: string,
  ): Promise<PaginatedResponse<PublicTripInstanceData>> {
    return this.publicTripQueryService.findByOrgSlug(options, slug);
  }
}
