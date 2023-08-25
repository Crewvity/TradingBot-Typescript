import { AppModule } from 'src/app.module';
import { CommandFactory } from 'nest-commander';

async function bootstrap() {
  await CommandFactory.run(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
}

void bootstrap();
