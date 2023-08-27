import Big from 'big.js';
import { CurrencyId, PositionSize } from 'src/commons/constants';
import {
  Strategy,
  StrategyConstructorParams,
  StrategyParams,
} from 'src/strategy/strategies/strategy';
import { SMA } from 'trading-signals';
import { takeRight } from 'lodash';

export interface MacParams extends StrategyParams {
  shortPeriod: number;
  longPeriod: number;
}

export class MacStrategy extends Strategy<MacParams> {
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
      this.openPositionImpl(true);
    } else if (!this.isLongPosition) {
      this.closePositionImpl();
    }
  }

  private handleDownwardCross() {
    if (!this.positionOpened) {
      this.openPositionImpl(false);
    } else if (this.isLongPosition) {
      this.closePositionImpl();
    }
  }

  private async openPositionImpl(isLong: boolean) {
    const crewvityPositionId = await this.openPosition(
      this.params.assetIds[0],
      isLong,
      PositionSize.Five,
    );

    if (crewvityPositionId) {
      this.crewvityPositionId = crewvityPositionId;
      this.positionOpened = true;
      this.isLongPosition = isLong;
    }
  }

  private async closePositionImpl() {
    const closed = await this.closePosition(this.crewvityPositionId);

    if (closed) {
      this.crewvityPositionId = null;
      this.positionOpened = false;
    }
  }

  async dispose() {}
}
