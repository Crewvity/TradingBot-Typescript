import Big from 'big.js';
import {
  CurrencyId,
  PositionDirection,
  PositionSize,
} from 'src/commons/constants';
import {
  Strategy,
  StrategyConstructorParams,
  StrategyParams,
} from 'src/strategy/types/strategy';
import { SMA } from 'trading-signals';
import { takeRight } from 'lodash';
import { Logger } from '@nestjs/common';

export interface MacParams extends StrategyParams {
  shortPeriod: number;
  longPeriod: number;
}

export class MacStrategy extends Strategy<MacParams> {
  private readonly logger = new Logger(MacStrategy.name);

  private readonly shortSma: SMA;
  private readonly longSma: SMA;
  private prevShortSmaValue: Big | null = null;
  private prevLongSmaValue: Big | null = null;
  private positionOpened: boolean = false;
  private crewvityPositionId: string | null = null;
  private isLongPosition: boolean = false;

  constructor(
    readonly strategyConstructorParams: StrategyConstructorParams<MacParams>,
  ) {
    super(strategyConstructorParams);
    this.shortSma = new SMA(this.params.shortPeriod);
    this.longSma = new SMA(this.params.longPeriod);
  }

  async initialise() {
    const longPeriodRecentRates = await this.marketDataService.getRecentRates(
      this.params.assetIds[0],
      this.params.longPeriod,
    );

    const shortPeriodRecentRates: Big[] = takeRight(
      longPeriodRecentRates,
      this.params.shortPeriod,
    );

    this.shortSma.updates(shortPeriodRecentRates);
    this.longSma.updates(longPeriodRecentRates);
  }

  async onMarketDataUpdate(marketData: Record<CurrencyId, Big>) {
    const latestRate = marketData[this.params.assetIds[0]];
    this.shortSma.update(latestRate);
    this.longSma.update(latestRate);

    const shortSmaValue = this.shortSma.getResult();
    const longSmaValue = this.longSma.getResult();

    if (this.prevShortSmaValue && this.prevLongSmaValue) {
      this.handleCrossing(shortSmaValue, longSmaValue);
    }

    this.prevShortSmaValue = shortSmaValue;
    this.prevLongSmaValue = longSmaValue;
  }

  private handleCrossing(shortSmaValue: Big, longSmaValue: Big) {
    const shortCrossedLongUpward =
      this.prevShortSmaValue.lt(this.prevLongSmaValue) &&
      shortSmaValue.gt(longSmaValue);
    const shortCrossedLongDownward =
      this.prevShortSmaValue.gt(this.prevLongSmaValue) &&
      shortSmaValue.lt(longSmaValue);

    if (shortCrossedLongUpward) {
      this.handleUpwardCross();
    } else if (shortCrossedLongDownward) {
      this.handleDownwardCross();
    }
  }

  private handleUpwardCross() {
    if (!this.positionOpened) {
      this.openPosition(true);
    } else if (!this.isLongPosition) {
      this.closePosition();
    }
  }

  private handleDownwardCross() {
    if (!this.positionOpened) {
      this.openPosition(false);
    } else if (this.isLongPosition) {
      this.closePosition();
    }
  }

  private async openPosition(isLong: boolean) {
    try {
      const { id: positionId } = await this.crewvityService.openPosition(
        this.crewvityStrategyId,
        isLong ? PositionDirection.Long : PositionDirection.Short,
        this.params.assetIds[0],
        PositionSize.Five,
      );

      this.crewvityPositionId = positionId;
      this.positionOpened = true;
      this.isLongPosition = isLong;

      this.logger.log(
        `Strategy[${this.strategyId}] :: Variant[${this.variantId}] :: opened position :: ID ${this.crewvityPositionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Strategy[${this.strategyId}] :: Variant[${this.variantId}] :: failed to open position`,
        error,
      );
    }
  }

  private async closePosition() {
    try {
      const closingPositionId = this.crewvityPositionId!;
      await this.crewvityService.closePosition(closingPositionId);
      this.crewvityPositionId = null;
      this.positionOpened = false;

      this.logger.log(
        `Strategy[${this.strategyId}] :: Variant[${this.variantId}] :: closed position :: ID ${closingPositionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Strategy[${this.strategyId}] :: Variant[${this.variantId}] :: failed to close position`,
        error,
      );
    }
  }

  async dispose() {}
}
