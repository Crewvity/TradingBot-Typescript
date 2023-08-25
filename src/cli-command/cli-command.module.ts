import { Module } from '@nestjs/common';
import { StrategyModule } from 'src/strategy/strategy.module';
import { AddStrategyCmd } from 'src/cli-command/strategy/add-strategy';
import { CrewvityModule } from 'src/crewvity/crewvity.module';
import { CrewvityGetAssetsCmd } from 'src/cli-command/crewvity/get-assets';
import { CrewvityCloseAllOpenPositionsCmd } from 'src/cli-command/crewvity/close-all-open-positions';

@Module({
  imports: [StrategyModule, CrewvityModule],
  providers: [
    AddStrategyCmd,
    CrewvityCloseAllOpenPositionsCmd,
    CrewvityGetAssetsCmd,
  ],
})
export class CliCommandModule {}
