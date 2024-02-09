import { injectable } from 'inversify';
import { default as pino } from 'pino';
import { type PrettyOptions } from 'pino-pretty';

@injectable()
export class LoggingService {
  private context: object = null;
  private readonly logger = pino({
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      } as PrettyOptions,
    },
  });

  public withContext(context: object) {
    this.context = context ?? null;
    return this;
  }

  public info(message: string, ...args: unknown[]) {
    this.logger.info(this.context, message, ...args);
  }
}
