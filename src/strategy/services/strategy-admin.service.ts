import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StrategyId } from 'src/commons/constants';
import { StrategyVariantEntity } from 'src/database/entities/strategy-variant.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StrategyAdminService {
  constructor(
    @InjectRepository(StrategyVariantEntity)
    private readonly strategyVariantRepo: Repository<
      StrategyVariantEntity<unknown>
    >,
  ) {}

  async addStrategyVariantToDatabase(
    strategyId: StrategyId,
    variantId: string,
    crewvityStrategyId: string,
    params: unknown,
  ) {
    const variantEntity = this.strategyVariantRepo.create({
      strategyId,
      variantId,
      crewvityStrategyId,
      params,
    });
    await this.strategyVariantRepo.save(variantEntity);
  }
}
