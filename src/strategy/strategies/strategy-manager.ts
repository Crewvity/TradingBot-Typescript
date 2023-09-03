import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Big from 'big.js';
import { CurrencyId, StrategyId } from 'src/commons/constants';
import { CatchErrors } from 'src/commons/error-handlers/catch-errors-decorator';
import { TradingBotException } from 'src/commons/errors/trading-bot-exception';
import { Topic } from 'src/commons/events/topics';
import { StrategyVariantEntity } from 'src/database/entities/strategy-variant.entity';
import { Strategy, StrategyParams } from 'src/strategy/strategies/strategy';
import { StrategyManagerContext } from 'src/strategy/strategies/strategy-manager-context';

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
    protected readonly ctx: StrategyManagerContext<StrategyType>,
  ) {}

  // NestJS runs this when the server is fully initialised
  @CatchErrors()
  async onModuleInit() {
    if (process.env.CLI) return;

    this.logger.log(`Strategy[${this.strategyId}] :: initialising...`);

    const variantEntities = await this.ctx.strategyVariantRepo.find({
      where: {
        strategyId: this.strategyId,
      },
    });

    this.strategies = this.instantiateStrategies(variantEntities);
    this.logger.log(
      `Strategy[${this.strategyId}] :: instantiated ${variantEntities.length} variants`,
    );

    const initialisedStrategies = [];

    await Promise.all(
      this.strategies.map(async (strategy) => {
        try {
          await strategy.initialise();
          this.logger.log(
            `Strategy[${this.strategyId}] :: completed Variant[${strategy.variantId}] initialisation`,
          );
          initialisedStrategies.push(strategy);
        } catch (error) {
          throw new TradingBotException(
            'Failed to initialise a strategy variant',
            {
              error,
              context: {
                strategyId: this.strategyId,
                variantId: strategy.variantId,
                strategyParams: strategy.params,
              },
            },
          );
        }
      }),
    );
    this.strategies = initialisedStrategies;

    this.logger.log(
      `Strategy[${this.strategyId}] :: ${this.strategies.length} strategy variants initialised`,
    );
  }

  // NestJS runs this when the server is shutting down
  async onApplicationShutdown() {
    for (const strategy of this.strategies) {
      try {
        await strategy.dispose();
      } catch (error) {
        reportError({
          error: new TradingBotException(
            'Failed to dispose a strategy variant',
            {
              error,
              context: {
                strategyId: this.strategyId,
                variantId: strategy.variantId,
                strategyParams: strategy.params,
              },
            },
          ),
        });
      }
    }
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

    this.strategies.forEach(async (strategy) => {
      try {
        const marketData = strategy.params.assetIds.reduce(
          (acc, assetId) => {
            return {
              ...acc,
              [assetId]: this.ctx.marketDataService.getCurrentPrice(assetId),
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

        await strategy.onMarketDataUpdate(marketData);
      } catch (error) {
        reportError({
          error: new TradingBotException(
            'Failed to complete onMarketDataUpdate for a strategy variant',
            {
              error,
              context: {
                strategyId: this.strategyId,
                variantId: strategy.variantId,
                strategyParams: strategy.params,
              },
            },
          ),
        });
      }
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
