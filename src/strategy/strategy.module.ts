import { Module } from '@nestjs/common';
import { DatabaseMoodule } from 'src/database/database.module';
import { MacStrategyManager } from 'src/strategy/strategies/mac/mac-manager';
import { MarketDataModule } from 'src/market-data/market-data.module';
import { StrategyAdminService } from 'src/strategy/services/strategy-admin.service';
import { CrewvityModule } from 'src/crewvity/crewvity.module';

@Module({
  imports: [DatabaseMoodule, MarketDataModule, CrewvityModule],
  providers: [MacStrategyManager, StrategyAdminService],
  exports: [StrategyAdminService],
})
export class StrategyModule {}