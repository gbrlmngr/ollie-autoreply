import { resolve } from 'node:path';
import { readdir } from 'node:fs/promises';
import { inject, injectable, decorate } from 'inversify';
import { Client, GatewayIntentBits, type ClientEvents } from 'discord.js';
import { EventEmitter } from 'eventemitter3';

import { LoggingService } from '../../services';
import { Listener } from '../../listeners';
import { RedisClient } from '../redis';
import { PrismaClient } from '../prisma';

decorate(injectable(), Client);

@injectable()
export class DiscordClient<
  Ready extends boolean = boolean
> extends Client<Ready> {
  public constructor(
    @inject(LoggingService) public readonly logger: LoggingService,
    @inject(RedisClient) public readonly redis: RedisClient,
    @inject(PrismaClient) public readonly prisma: PrismaClient,
    @inject(EventEmitter) public readonly ee: EventEmitter
  ) {
    super({
      intents: [GatewayIntentBits.Guilds],
    });

    this.loadListeners();
  }

  private async loadListeners() {
    try {
      const listenerFiles = (
        await readdir(resolve(__dirname, '..', '..', 'listeners'))
      )
        .filter((fileName) => /^(.+)\.listener\.(t|j)s$/.test(fileName))
        .map((fileName) => fileName.replace(/\.(t|j)s$/, ''));

      for (const listenerFile of listenerFiles) {
        this.logger.debug(`Reading listener file "${listenerFile}"...`);

        const ListenerClass = (
          await import(
            resolve(__dirname, '..', '..', 'listeners', listenerFile)
          ).catch((error) => {
            this.logger
              .error(`🔴 Unable to import listener "${listenerFile}".`)
              .error(`🔴 Reason: ${error.message ?? error}`);
          })
        ).default;

        const listener = new ListenerClass(this) as Listener<
          keyof ClientEvents
        >;
        if (listener.disabled) continue;

        this.logger.debug(
          `Registering event handler "${listener.name}" for event "${listener.eventName}"...`
        );
        this[listener.once ? 'once' : 'on'](
          listener.eventName,
          async (...args) => {
            try {
              await listener.onRun(...args);
            } catch (error) {
              this.logger
                .error(
                  `🔴 Unable to run listener "${listener.name}" for event "${listener.eventName}".`
                )
                .error(`🔴 Reason: ${error.message ?? error}`);
            }
          }
        );
      }
    } catch (error) {
      this.logger
        .error('🔴 Unable to load or run the listeners.')
        .error(`🔴 Reason: ${error.message ?? error}`);
    }
  }
}
