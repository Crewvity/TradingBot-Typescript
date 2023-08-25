import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import Big from 'big.js';
import { OnEvent } from '@nestjs/event-emitter';
import { MarketDataService } from 'src/market-data/services/market-data.service';
import { CurrencyId, StrategyId } from 'src/commons/constants';
import { Topic } from 'src/commons/events/topics';
import { Strategy, StrategyParams } from 'src/strategy/types/strategy';
import { Repository } from 'typeorm';
import { StrategyVariantEntity } from 'src/database/entities/strategy-variant.entity';
import { CrewvityService } from 'src/crewvity/services/crewvity.service';

@Injectable()
export abstract class StrategyManager<
    StrategyType extends Strategy<StrategyParams>,
  >
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(StrategyManager.name);

  protected strategies: StrategyType[] = [];

  constructor(
    protected readonly strategyId: StrategyId,
    protected readonly strategyVariantRepo: Repository<
      StrategyVariantEntity<StrategyType['params']>
    >,
    protected readonly marketDataService: MarketDataService,
    protected readonly crewvityService: CrewvityService,
  ) {}

  // NestJS runs this when the server is fully initialised
  async onModuleInit() {
    if (process.env.CLI) return;

    this.logger.log(`Strategy[${this.strategyId}] :: initialising...`);

    try {
      const variantEntities = await this.strategyVariantRepo.find({
        where: {
          strategyId: this.strategyId,
        },
      });

      this.strategies = this.instantiateStrategies(variantEntities);
      this.logger.log(
        `Strategy[${this.strategyId}] :: instantiated ${variantEntities.length} variants`,
      );
    } catch (error) {
      this.strategies = [];
      this.logger.error(
        `Strategy[${this.strategyId}] :: failed to instantiate variants`,
      );
    }

    await Promise.all(
      this.strategies.map(async (strategy) => {
        await strategy.initialise();
        this.logger.log(
          `Strategy[${this.strategyId}] :: completed Variant[${strategy.variantId}] initialisation`,
        );
      }),
    );
    this.logger.log(
      `Strategy[${this.strategyId}] :: all strategy variants initialised`,
    );
  }

  // NestJS runs this when the server is shutting down
  async onApplicationShutdown() {
    const allDisposePromises = this.strategies.map((strategy) => {
      return strategy.dispose().catch((err) => {
        // We don't want to throw an error here because it will prevent
        // the server from shutting down.
        console.error(err);
      });
    });
    await Promise.all(allDisposePromises);
  }

  /**
   * Whenever there is market data updated event, we want to prepare
   * only the market data for each strategy needs and call the onMarketDataUpdate
   */
  @OnEvent(Topic.MarketData.Updated)
  onMarketDataUpdate() {
    if (this.strategies.length === 0) return;

    this.logger.log(
      `Strategy[${this.strategyId}] :: received ${Topic.MarketData.Updated} event`,
    );

    this.strategies.forEach((strategy) => {
      const marketData = strategy.params.assetIds.reduce(
        (acc, assetId) => {
          return {
            ...acc,
            [assetId]: this.marketDataService.getCurrentPrice(assetId),
          };
        },
        {} as Record<CurrencyId, Big>,
      );

      this.logger.log(
        `Strategy[${this.strategyId}] :: extracted ${JSON.stringify(
          marketData,
          null,
          2,
        )} for Variant[${strategy.variantId}] and notifying`,
      );

      strategy.onMarketDataUpdate(marketData);
    });
  }

  /**
   * We have to rely on the subclass to instantiate the strategies because
   * the subclass has access to the concrete Strategy class.
   */
  abstract instantiateStrategies(
    variantEntities: StrategyVariantEntity<StrategyType['params']>[],
  ): StrategyType[];
}
