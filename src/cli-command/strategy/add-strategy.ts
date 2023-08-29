import { Command } from 'nest-commander';
import { SafeCommandRunner } from 'src/cli-command/safe-command-runner';
import { CurrencyId, StrategyId } from 'src/commons/constants';
import { StrategyAdminService } from 'src/strategy/services/strategy-admin.service';

@Command({ name: 'add-strategy' })
export class AddStrategyCmd extends SafeCommandRunner {
  constructor(private readonly strategyAdminService: StrategyAdminService) {
    super();
  }

  async safeRun() {
    // strategy ID: whatever you want to identify it by
    // variant ID: strategy can have multiple variants, something you can ID it by
    const strategyId = StrategyId.MovingAverageCross;
    const variantId_1 = 'fast-cross';
    const variantId_2 = 'medium-cross';
    const variantId_3 = 'slow-cross';

    // First register your new strategy in Crewvity and get the ID
    const crewvityStrategyId_1 = 'some_UUID_here';
    const crewvityStrategyId_2 = 'some_UUID_here';
    const crewvityStrategyId_3 = 'some_UUID_here';

    const strategyVariantsToAdd = [
      {
        strategyId,
        variantId: variantId_1,
        crewvityStrategyId: crewvityStrategyId_1,
        params: {
          assetIds: [CurrencyId.Bitcoin],
          fastPeriod: 20,
          slowPeriod: 40,
        },
      },
      {
        strategyId,
        variantId: variantId_2,
        crewvityStrategyId: crewvityStrategyId_2,
        params: {
          assetIds: [CurrencyId.Bitcoin],
          fastPeriod: 30,
          slowPeriod: 60,
        },
      },
      {
        strategyId,
        variantId: variantId_3,
        crewvityStrategyId: crewvityStrategyId_3,
        params: {
          assetIds: [CurrencyId.Bitcoin],
          fastPeriod: 40,
          slowPeriod: 80,
        },
      },
    ];

    for (const variant of strategyVariantsToAdd) {
      await this.strategyAdminService.addStrategyVariantToDatabase(
        variant.strategyId,
        variant.variantId,
        variant.crewvityStrategyId,
        variant.params,
      );
    }
  }
}
