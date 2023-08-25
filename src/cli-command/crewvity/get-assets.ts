import { Command } from 'nest-commander';
import { SafeCommandRunner } from 'src/cli-command/safe-command-runner';
import { CrewvityService } from 'src/crewvity/services/crewvity.service';

@Command({ name: 'crewvity-get-assets' })
export class CrewvityGetAssetsCmd extends SafeCommandRunner {
  constructor(private readonly crewvityService: CrewvityService) {
    super();
  }

  async safeRun() {
    const assets = await this.crewvityService.getAssets();
    console.log(assets);
  }
}
