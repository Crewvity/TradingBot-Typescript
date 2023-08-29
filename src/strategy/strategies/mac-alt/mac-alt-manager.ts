import { Injectable } from '@nestjs/common';
import { StrategyId } from 'src/commons/constants';
import { StrategyVariantEntity } from 'src/database/entities/strategy-variant.entity';
import { StrategyManager } from 'src/strategy/strategies/strategy-manager';
import { StrategyManagerContext } from 'src/strategy/strategies/strategy-manager-context';
import {
  MacAltParams,
  MacAltStrategy,
} from 'src/strategy/strategies/mac-alt/mac-alt-strategy';

@Injectable()
export class MacAltStrategyManager extends StrategyManager<MacAltStrategy> {
  constructor(readonly ctx: StrategyManagerContext<MacAltStrategy>) {
    super(StrategyId.MovingAverageCrossAlternate, ctx);
  }

  instantiateStrategies(
    variantEntities: StrategyVariantEntity<MacAltParams>[],
  ): MacAltStrategy[] {
    return variantEntities.map(
      (variantEntity) =>
        new MacAltStrategy({
          ...variantEntity,
          marketDataService: this.ctx.marketDataService,
          crewvityService: this.ctx.crewvityService,
        }),
    );
  }
}
