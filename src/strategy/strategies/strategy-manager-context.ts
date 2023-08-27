import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MarketDataService } from 'src/market-data/services/market-data.service';
import { StrategyVariantEntity } from 'src/database/entities/strategy-variant.entity';
import { CrewvityService } from 'src/crewvity/services/crewvity.service';
import { Strategy, StrategyParams } from 'src/strategy/strategies/strategy';

@Injectable()
export class StrategyManagerContext<
  StrategyType extends Strategy<StrategyParams>,
> {
  constructor(
    @InjectRepository(StrategyVariantEntity)
    readonly strategyVariantRepo: Repository<
      StrategyVariantEntity<StrategyType['params']>
    >,
    readonly marketDataService: MarketDataService,
    readonly crewvityService: CrewvityService,
  ) {}
}
