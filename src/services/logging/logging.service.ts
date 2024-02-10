import { injectable } from 'inversify';
import { default as pino } from 'pino';
import { type PrettyOptions } from 'pino-pretty';

import { NODE_ENV } from '../../environment';

@injectable()
export class LoggingService {
  private readonly logger = pino({
    level: NODE_ENV === 'development' ? 'debug' : 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      } as PrettyOptions,
    },
  });

  public trace(message: string, ...args: unknown[]) {
    this.logger.trace(message, ...args);
    return this;
  }

  public debug(message: string, ...args: unknown[]) {
    this.logger.debug(message, ...args);
    return this;
  }

  public info(message: string, ...args: unknown[]) {
    this.logger.info(message, ...args);
    return this;
  }

  public warn(message: string, ...args: unknown[]) {
    this.logger.warn(message, ...args);
    return this;
  }

  public error(message: string, ...args: unknown[]) {
    this.logger.error(message, ...args);
    return this;
  }
}
