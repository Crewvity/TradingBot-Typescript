import Big from 'big.js';
import { CurrencyId, PositionSize } from 'src/commons/constants';
import {
  Strategy,
  StrategyConstructorParams,
  StrategyParams,
} from 'src/strategy/strategies/strategy';
import { SMA } from 'trading-signals';
import { takeRight } from 'lodash';

export interface MacAltParams extends StrategyParams {
  fastPeriod: number;
  slowPeriod: number;
}

/**
 * Similar to the plain MAC strategy except that it opens positions in alternating directions.
 */
export class MacAltStrategy extends Strategy<MacAltParams> {
  private readonly fastSma: SMA;
  private readonly slowSma: SMA;
  private prevFastSmaValue: Big | null = null;
  private prevSlowSmaValue: Big | null = null;
  private positionOpened: boolean = false;
  private crewvityPositionId: string | null = null;
  private isLongPosition: boolean = false;
  private ignoreNextCross: boolean = false;

  constructor(
    readonly strategyConstructorParams: StrategyConstructorParams<MacAltParams>,
  ) {
    super(strategyConstructorParams);
    this.fastSma = new SMA(this.params.fastPeriod);
    this.slowSma = new SMA(this.params.slowPeriod);
  }

  async initialise() {
    const longPeriodRecentRates = await this.marketDataService.getRecentRates(
      this.params.assetIds[0],
      this.params.slowPeriod,
    );

    const fastPeriodRecentRates: Big[] = takeRight(
      longPeriodRecentRates,
      this.params.fastPeriod,
    );

    this.fastSma.updates(fastPeriodRecentRates);
    this.slowSma.updates(longPeriodRecentRates);
  }

  async onMarketDataUpdate(marketData: Record<CurrencyId, Big>) {
    const latestRate = marketData[this.params.assetIds[0]];
    this.fastSma.update(latestRate);
    this.slowSma.update(latestRate);

    const fastSmaValue = this.fastSma.getResult();
    const slowSmaValue = this.slowSma.getResult();

    if (this.prevFastSmaValue !== null && this.prevSlowSmaValue !== null) {
      await this.handleCrossing(fastSmaValue, slowSmaValue);
    }

    this.prevFastSmaValue = fastSmaValue;
    this.prevSlowSmaValue = slowSmaValue;
  }

  private async handleCrossing(fastSmaValue: Big, slowSmaValue: Big) {
    const fastCrossedSlowUpward =
      this.prevFastSmaValue.lt(this.prevSlowSmaValue) &&
      fastSmaValue.gt(slowSmaValue);
    const fastCrossedSlowDownward =
      this.prevFastSmaValue.gt(this.prevSlowSmaValue) &&
      fastSmaValue.lt(slowSmaValue);

    if (
      (fastCrossedSlowUpward || fastCrossedSlowDownward) &&
      this.ignoreNextCross
    ) {
      this.ignoreNextCross = false;
      return;
    }

    if (fastCrossedSlowDownward) {
      await this.handleDownwardCross();
    } else if (fastCrossedSlowUpward) {
      await this.handleUpwardCross();
    }
  }

  private async handleUpwardCross() {
    if (!this.positionOpened) {
      await this.openPositionImpl(true);
    } else if (!this.isLongPosition) {
      await this.closePositionImpl();
      this.ignoreNextCross = true;
    }
  }

  private async handleDownwardCross() {
    if (!this.positionOpened) {
      await this.openPositionImpl(false);
    } else if (this.isLongPosition) {
      await this.closePositionImpl();
      this.ignoreNextCross = true;
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
