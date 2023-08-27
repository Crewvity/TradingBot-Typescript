import { Logger } from '@nestjs/common';
import Big from 'big.js';
import { CurrencyId, PositionDirection, PositionSize } from 'src/commons/constants';
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
};

export abstract class Strategy<ParamsType extends StrategyParams> {
  protected logger = new Logger(Strategy.name);

  readonly strategyId: string;
  readonly variantId: string;
  readonly crewvityStrategyId: string;
  readonly params: ParamsType;
  protected readonly marketDataService: MarketDataService;
  protected readonly crewvityService: CrewvityService;

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

  protected async openPosition(
    assetId: CurrencyId,
    isLong: boolean,
    size: PositionSize,
  ): Promise<string | undefined> {
    try {
      const { id: crewvityPositionId } =
        await this.crewvityService.openPosition(
          this.crewvityStrategyId,
          isLong ? PositionDirection.Long : PositionDirection.Short,
          assetId,
          size,
        );

      this.logger.log(
        `Strategy[${this.strategyId}] :: Variant[${this.variantId}] :: opened position :: Crewvity ID ${crewvityPositionId}`,
      );

      return crewvityPositionId;
    } catch (error) {
      this.logger.error(
        `Strategy[${this.strategyId}] :: Variant[${this.variantId}] :: failed to open position`,
        error,
      );
    }

    // Here, you can also place your real trades to an exchange to open a position there
    /*
    try {
      this.exchangeService.placeOrder(...);
    } catch (error) {
      ...
    }
    */
  }

  protected async closePosition(crewvityPositionId: string) {
    try {
      await this.crewvityService.closePosition(crewvityPositionId);

      this.logger.log(
        `Strategy[${this.strategyId}] :: Variant[${this.variantId}] :: closed position :: Crewvity ID ${crewvityPositionId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Strategy[${this.strategyId}] :: Variant[${this.variantId}] :: failed to close position`,
        error,
      );
    }

    // Here, you can also place your real trades to an exchange to close a position there
    /*
    try {
      this.exchangeService.placeOrder(...);
    } catch (error) {
      ...
    }
    */

    return false;
  }
}
