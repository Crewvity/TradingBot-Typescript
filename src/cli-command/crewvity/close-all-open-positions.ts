import { Command } from 'nest-commander';
import { SafeCommandRunner } from 'src/cli-command/safe-command-runner';
import { CrewvityService } from 'src/crewvity/services/crewvity.service';

@Command({ name: 'crewvity-close-all-open-positions' })
export class CrewvityCloseAllOpenPositionsCmd extends SafeCommandRunner {
  constructor(private readonly crewvityService: CrewvityService) {
    super();
  }

  async safeRun() {
    const positions = await this.crewvityService.getAllOpenPositions();
    console.log(`Found ${positions.length} open positions`);

    for (const position of positions) {
      await this.crewvityService.closePosition(position.id);
    }
    console.log(`Closed all open positions`);
  }
}
