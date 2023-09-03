export class TradingBotException extends Error {
  readonly error?: unknown;
  readonly context?: { [key: string]: unknown };

  constructor(
    message: string,
    { error, ...context }: { error?: unknown; [key: string]: unknown } = {},
  ) {
    super(message);
    this.name = TradingBotException.name;
    this.error = error;
    this.context = context;
  }
}

export const getErrorMessages = (
  error: unknown,
  _messages?: string[],
): string[] => {
  const messages = _messages ?? [];
  if (error instanceof TradingBotException) {
    messages.push(`${error.name}: ${error.message}`);
    if (error.error) {
      getErrorMessages(error.error, messages);
    }
  } else if (error instanceof Error) {
    messages.push(error.stack ?? `${error.name}: ${error.message}`);
  }
  return messages;
};
