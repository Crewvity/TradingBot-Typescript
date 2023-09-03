import { Logger } from '@nestjs/common';
import { CommandRunner } from 'nest-commander';
import { reportError } from 'src/commons/error-handlers/report-error';

// The default CommandRunner does not catch uncaught errors at all.
// This class makes sure the uncaught errors are at least caught and logged.
export abstract class SafeCommandRunner extends CommandRunner {
  private readonly logger = new Logger(SafeCommandRunner.name);

  async run(positionalArgs: unknown, optionalArgs?: unknown): Promise<void> {
    try {
      await this.safeRun(positionalArgs, optionalArgs);
    } catch (error) {
      reportError({ error, logger: this.logger });
    }
  }

  protected abstract safeRun(
    positionalArgs: unknown,
    optionalArgs?: unknown,
  ): Promise<void>;
}
