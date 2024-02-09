import { injectable } from 'inversify';
import { default as pino } from 'pino';
import { type PrettyOptions } from 'pino-pretty';

@injectable()
export class LoggingService {
  private context: object = {};
  private readonly logger = pino({
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      } as PrettyOptions,
    },
  });

  public withContext(context: object) {
    this.context = context ?? {};
    return this;
  }

  public trace(message: string, ...args: unknown[]) {
    this.logger.trace(this.context, message, ...args);
  }

  public debug(message: string, ...args: unknown[]) {
    this.logger.debug(this.context, message, ...args);
  }

  public info(message: string, ...args: unknown[]) {
    this.logger.info(this.context, message, ...args);
  }

  public warn(message: string, ...args: unknown[]) {
    this.logger.warn(this.context, message, ...args);
  }

  public error(message: string, ...args: unknown[]) {
    this.logger.error(this.context, message, ...args);
  }
}
