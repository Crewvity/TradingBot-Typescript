import { Logger } from '@nestjs/common';
import Big from 'big.js';
import { CurrencyId } from 'src/commons/constants';
import { CrewvityService } from 'src/crewvity/services/crewvity.service';
import { MarketDataService } from 'src/market-data/services/market-data.service';

export interface StrategyParams {
  assetIds: CurrencyId[];
}

export type StrategyConstructorParams<ParamsType extends StrategyParams> = {
  strategyId: string;
  variantId: string;
  crewvityStrategyId: string;
  params: ParamsType;
  marketDataService: MarketDataService;
  crewvityService: CrewvityService;
}

export abstract class Strategy<ParamsType extends StrategyParams> {
  readonly strategyId: string;
  readonly variantId: string;
  readonly crewvityStrategyId: string;
  readonly params: ParamsType;
  readonly marketDataService: MarketDataService;
  readonly crewvityService: CrewvityService;

  constructor(
    readonly strategyConstructorParams: StrategyConstructorParams<ParamsType>,
  ) {
    this.strategyId = strategyConstructorParams.strategyId;
    this.variantId = strategyConstructorParams.variantId;
    this.crewvityStrategyId = strategyConstructorParams.crewvityStrategyId;
    this.params = strategyConstructorParams.params;
    this.marketDataService = strategyConstructorParams.marketDataService;
    this.crewvityService = strategyConstructorParams.crewvityService;
  }

  abstract initialise(): Promise<void>;

  abstract onMarketDataUpdate(
    marketData: Record<CurrencyId, Big>,
  ): Promise<void>;

  abstract dispose(): Promise<void>;
}
