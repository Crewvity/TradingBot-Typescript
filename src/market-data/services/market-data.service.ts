import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CoincapService } from 'src/market-data/services/coincap.service';
import {
  CandleInterval,
  CurrencyId,
  CurrencySymbol,
} from 'src/commons/constants';
import { deepFreeze } from 'src/commons/utils';
import { Topic } from 'src/commons/events/topics';
import Big from 'big.js';

@Injectable()
export class MarketDataService implements OnModuleInit {
  private readonly logger = new Logger(MarketDataService.name);

  private latestMarketData: Partial<Record<CurrencyId, Big>> = {};

  constructor(
    private readonly coincapService: CoincapService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    const rates = await this.coincapService.getCryptoRates();
    rates.forEach((rate) => {
      this.latestMarketData[rate.id] = rate.rateUsd;
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async publishCryptoRates() {
    if (process.env.CLI) return;

    try {
      this.logger.log('Refreshing crypto rates');
      await this.refreshCryptoRates();
      this.logger.log('Refreshed crypto rates');
    } catch (error) {
      this.logger.error('Failed to refresh crypto rates', error);
    }
    this.eventEmitter.emit(Topic.MarketData.Updated);
    this.logger.log(`Emitted ${Topic.MarketData.Updated} event`);
  }

  getCurrentPrice(assetId: CurrencyId): Big {
    return this.latestMarketData[assetId];
  }

  async getRecentRates(assetId: CurrencyId, numRates: number): Promise<Big[]> {
    const rates = await this.coincapService.getRecentRatesInCandles(
      assetId,
      CandleInterval.OneMinute,
      numRates,
    );
    return rates.map((r) => new Big(r.priceUsd));
  }

  getAssets() {
    return Object.entries(CurrencySymbol).map((cs) => ({
      id: cs[0],
      symbol: cs[1],
    }));
  }

  private async refreshCryptoRates() {
    const rates = await this.coincapService.getCryptoRates();
    const cryptoRates = rates.filter((r) => r.type === 'crypto');
    const marketData: Partial<Record<CurrencyId, Big>> = {};
    cryptoRates.forEach((rate) => {
      marketData[rate.id] = new Big(rate.rateUsd);
    });
    this.latestMarketData = deepFreeze(marketData);
    this.logger.log('New rates from coincap.io: ', this.latestMarketData);
  }
}
