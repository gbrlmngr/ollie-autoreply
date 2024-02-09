import { inject, injectable, decorate } from 'inversify';
import { Client } from 'discord.js';

import { LoggingService } from '../../services';

decorate(injectable(), Client);

@injectable()
export class DiscordClient<
  Ready extends boolean = boolean
> extends Client<Ready> {
  public constructor(
    @inject(LoggingService) private loggingService: LoggingService
  ) {
    super({
      intents: [],
    });

    this.loggingService.withContext({}).info(`Discord client initialized`);
  }
}
