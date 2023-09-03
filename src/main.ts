import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { AppModule } from 'src/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow('PORT');

  if (configService.getOrThrow('NODE_ENV') !== 'development') {
    Sentry.init({
      dsn: configService.get('SENTRY_DSN'),
      environment: configService.get('NODE_ENV'),
      tracesSampleRate: 1.0,
    });
  }

  await app.listen(port);
}
bootstrap();
