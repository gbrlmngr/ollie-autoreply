import { resolve } from 'node:path';
import { readdir } from 'node:fs/promises';
import { inject, injectable, decorate } from 'inversify';
import {
  Client,
  GatewayIntentBits,
  type ClientEvents,
  Collection,
} from 'discord.js';
import { EventEmitter } from 'eventemitter3';

import { LoggingService } from '../../services';
import { Listener } from '../../listeners';
import { Command } from '../../commands';
import { RedisClient } from '../redis';
import { PrismaClient } from '../prisma';

decorate(injectable(), Client);

@injectable()
export class DiscordClient<
  Ready extends boolean = boolean
> extends Client<Ready> {
  public readonly commands: Collection<string, Command> = new Collection();

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
    this.loadCommands();
  }

  private async loadListeners() {
    try {
      const listenerFiles = (
        await readdir(resolve(__dirname, '..', '..', 'listeners'))
      )
        .filter((fileName) => /^(.+)\.listener\.(t|j)s$/.test(fileName))
        .map((fileName) => fileName.replace(/\.(t|j)s$/, ''));

      if (!listenerFiles.length) {
        this.logger.warn('No listener files have been found.');
        return;
      }

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

  private async loadCommands() {
    try {
      const commandFiles = (
        await readdir(resolve(__dirname, '..', '..', 'commands'))
      )
        .filter((fileName) => /^(.+)\.command\.(t|j)s$/.test(fileName))
        .map((fileName) => fileName.replace(/\.(t|j)s$/, ''));

      if (!commandFiles.length) {
        this.logger.warn('No command files have been found.');
        return;
      }

      for (const commandFile of commandFiles) {
        this.logger.debug(`Reading command file "${commandFile}"...`);

        const CommandClass = (
          await import(
            resolve(__dirname, '..', '..', 'commands', commandFile)
          ).catch((error) => {
            this.logger
              .error(`🔴 Unable to import command "${commandFile}"`)
              .error(`🔴 Reason: ${error.message ?? error}`);
          })
        ).default;

        const command = new CommandClass(this) as Command;
        if (command.disabled) continue;

        this.commands.set(command.definition.name, command);
      }
    } catch (error) {
      this.logger
        .error('🔴 Unable to register the commands.')
        .error(`🔴 Reason: ${error.message ?? error}`);
    }
  }
}
