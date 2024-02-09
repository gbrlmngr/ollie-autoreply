import { resolve } from 'node:path';
import { readdir } from 'node:fs/promises';
import { inject, injectable, decorate } from 'inversify';
import { Client, type ClientEvents } from 'discord.js';

import { LoggingService } from '$services';
import { Listener } from '$listeners';

decorate(injectable(), Client);

@injectable()
export class DiscordClient<
  Ready extends boolean = boolean
> extends Client<Ready> {
  public constructor(
    @inject(LoggingService) public readonly loggingService: LoggingService
  ) {
    super({
      intents: [],
    });

    this.loadListeners();
  }

  private async loadListeners() {
    const listenerFiles = (
      await readdir(resolve(__dirname, '..', '..', 'listeners'))
    )
      .filter((fileName) => /^(.+)\.listener\.(t|j)s$/.test(fileName))
      .map((fileName) => fileName.replace(/\.(t|j)s$/, ''));

    for (const listenerFile of listenerFiles) {
      const ListenerClass = (
        await import(resolve(__dirname, '..', '..', 'listeners', listenerFile))
      ).default;
      const listener = new ListenerClass(this) as Listener<keyof ClientEvents>;

      this[listener.once ? 'once' : 'on'](
        listener.eventName,
        listener.onRun.bind(listener)
      );
    }
  }
}
