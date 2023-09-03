import { Logger } from '@nestjs/common';
import { reportError } from 'src/commons/error-handlers/report-error';

const globalLogger = new Logger('Global');

export function CatchErrors() {
  return (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        reportError({ error, logger: globalLogger });
      }
    };

    return descriptor;
  };
}
