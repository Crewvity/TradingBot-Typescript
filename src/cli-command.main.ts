import { CommandFactory } from 'nest-commander';
import { AppModule } from 'src/app.module';
import { reportError } from 'src/commons/error-handlers/report-error';
import { TradingBotException } from 'src/commons/errors/trading-bot-exception';

process.on('uncaughtException', (error) => {
  if (error instanceof Error) {
    reportError({ error });
  } else {
    reportError({
      error: new TradingBotException('Unknown exception', { error }),
    });
  }
});

process.on('unhandledRejection', (reason, promise) => {
  if (reason instanceof Error) {
    reportError({ error: reason });
  } else {
    reportError({
      error: new TradingBotException('Unknown rejection', {
        error: reason,
        promise,
      }),
    });
  }
});

async function bootstrap() {
  await CommandFactory.run(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
}

void bootstrap();
