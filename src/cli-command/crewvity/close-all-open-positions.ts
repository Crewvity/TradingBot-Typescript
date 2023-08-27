import { Command } from 'nest-commander';
import { SafeCommandRunner } from 'src/cli-command/safe-command-runner';
import { CrewvityService } from 'src/crewvity/services/crewvity.service';

@Command({ name: 'crewvity-close-all-open-positions' })
export class CrewvityCloseAllOpenPositionsCmd extends SafeCommandRunner {
  constructor(private readonly crewvityService: CrewvityService) {
    super();
  }

  async safeRun() {
    await this.crewvityService.closeAllPositions();
  }
}
