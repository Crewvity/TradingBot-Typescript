import { ExecutionContext, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { addRequestDataToEvent } from '@sentry/node';
import {
  TradingBotException,
  getErrorMessages,
} from 'src/commons/errors/trading-bot-exception';

export function reportError({
  error,
  context,
  logger,
}: {
  error: unknown;
  context?: ExecutionContext;
  logger?: Logger;
}) {
  (logger ?? console).error(
    getErrorMessages(error)
      .map((message, index) => `${index + 1}) ${message}`)
      .join('\n\n'),
  );

  console.log('capturing error');
  console.log({
    error,
    context,
  });
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  const transaction = context?.switchToHttp().getRequest();

  Sentry.withScope((scope) => {
    if (error instanceof TradingBotException) {
      let currentException: TradingBotException | Error | undefined = error;
      while (currentException) {
        scope.addBreadcrumb({
          category: 'exception',
          message: currentException.message,
          data: {
            location: error.stack,
            context:
              currentException instanceof TradingBotException
                ? currentException.context
                : undefined,
          },
        });

        if (currentException instanceof TradingBotException) {
          currentException =
            currentException.error instanceof Error
              ? currentException.error
              : undefined;
        } else {
          break;
        }
      }
    }

    Sentry.captureException(error);

    if (transaction) {
      scope.addEventProcessor((event) =>
        addRequestDataToEvent(event, transaction, {
          include: {
            ip: true,
            request: ['method', 'url', 'headers'],
          },
        }),
      );
    }
  });
}
