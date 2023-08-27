import { Injectable } from '@nestjs/common';
import { StrategyId } from 'src/commons/constants';
import { StrategyVariantEntity } from 'src/database/entities/strategy-variant.entity';
import { StrategyManager } from 'src/strategy/strategies/strategy-manager';
import {
  MacParams,
  MacStrategy,
} from 'src/strategy/strategies/mac/mac-strategy';
import { StrategyManagerContext } from 'src/strategy/strategies/strategy-manager-context';

@Injectable()
export class MacStrategyManager extends StrategyManager<MacStrategy> {
  constructor(readonly ctx: StrategyManagerContext<MacStrategy>) {
    super(StrategyId.MovingAverageCross, ctx);
  }

  instantiateStrategies(
    variantEntities: StrategyVariantEntity<MacParams>[],
  ): MacStrategy[] {
    return variantEntities.map(
      (variantEntity) =>
        new MacStrategy({
          ...variantEntity,
          marketDataService: this.ctx.marketDataService,
          crewvityService: this.ctx.crewvityService,
        }),
    );
  }
}
