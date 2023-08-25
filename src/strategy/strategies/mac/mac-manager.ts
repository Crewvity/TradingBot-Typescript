import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StrategyId } from 'src/commons/constants';
import { StrategyVariantEntity } from 'src/database/entities/strategy-variant.entity';
import { MarketDataService } from 'src/market-data/services/market-data.service';
import { StrategyManager } from 'src/strategy/types/strategy-manager';
import {
  MacParams,
  MacStrategy,
} from 'src/strategy/strategies/mac/mac-strategy';
import { CrewvityService } from 'src/crewvity/services/crewvity.service';

@Injectable()
export class MacStrategyManager extends StrategyManager<MacStrategy> {
  constructor(
    @InjectRepository(StrategyVariantEntity)
    readonly strategyVariantRepo: Repository<StrategyVariantEntity<MacParams>>,
    readonly marketDataService: MarketDataService,
    readonly crewvityService: CrewvityService,
  ) {
    super(
      StrategyId.MovingAverageCross,
      strategyVariantRepo,
      marketDataService,
      crewvityService,
    );
  }

  instantiateStrategies(
    variantEntities: StrategyVariantEntity<MacParams>[],
  ): MacStrategy[] {
    return variantEntities.map(
      (variantEntity) =>
        new MacStrategy({
          ...variantEntity,
          marketDataService: this.marketDataService,
          crewvityService: this.crewvityService,
        }),
    );
  }
}
