import { performance, PerformanceObserver } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { readdir } from 'node:fs/promises';
import { inject, injectable, decorate } from 'inversify';
import {
  Client,
  GatewayIntentBits,
  type ClientEvents,
  Collection,
  EmbedBuilder,
  Locale,
} from 'discord.js';
import { EventEmitter } from 'eventemitter3';
import {
  RateLimiterRedis,
  type IRateLimiterRedisOptions,
} from 'rate-limiter-flexible';

import {
  LoggingService,
  I18NService,
  ActivitiesService,
  IdentityPrefixes,
} from '../../services';
import { Listener } from '../../listeners';
import { Command, CommandInstantiationTypes } from '../../commands';
import { DISymbols } from '../../di.interfaces';
import {
  EmbedAuthorIconUrl,
  GuildSettings,
  SecondaryEmbedColor,
} from '../../shared.interfaces';
import { RedisClient, RemovedKeyEvent } from '../redis';
import { PrismaClient } from '../prisma';
import {
  BotNotConfiguredException,
  CommandCooldownException,
  CommandNotAllowedException,
} from './discord.exceptions';

decorate(injectable(), Client);

@injectable()
export class DiscordClient<
  Ready extends boolean = boolean
> extends Client<Ready> {
  public readonly commands: Collection<string, Command> = new Collection();
  private readonly performanceObserver: PerformanceObserver =
    new PerformanceObserver((list) => {
      for (const { name, duration } of list.getEntries()) {
        this.logger.trace(`"${name}" took ${duration.toFixed(4)}ms.`);
      }
    });

  public constructor(
    @inject(DISymbols.EventEmitter) public readonly ee: EventEmitter,
    @inject(DISymbols.LoggingService) public readonly logger: LoggingService,
    @inject(DISymbols.I18NService) public readonly i18n: I18NService,
    @inject(DISymbols.ActivitiesService)
    public readonly activities: ActivitiesService,
    @inject(DISymbols.RedisClient) public readonly redis: RedisClient,
    @inject(DISymbols.PrismaClient) public readonly prisma: PrismaClient,
    @inject(`Factory<${RateLimiterRedis.name}>`)
    public readonly rlr: (options: IRateLimiterRedisOptions) => RateLimiterRedis
  ) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
      ],
    });

    this.performanceObserver.observe({ entryTypes: ['measure'] });
    this.onRedisEvents();
    this.loadListeners();
    this.loadCommands();
  }

  private async onRedisEvents() {
    this.ee.on(RemovedKeyEvent, this.onRedisRemovedKeyEvent.bind(this));
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
              .error(`└─ Reason: ${error.message ?? error}`);
          })
        ).default;

        const listener = new ListenerClass(this) as Listener<
          keyof ClientEvents
        >;
        if (listener.disabled) continue;

        this.logger.debug(
          `└─ Registering event handler "${listener.name}" for event "${listener.eventName}"...`
        );
        this[listener.once ? 'once' : 'on'](
          listener.eventName,
          async (...args) => {
            try {
              performance.mark(`${listener.name}.onRun():start`);
              await listener.onRun(...args);
              performance.mark(`${listener.name}.onRun():end`);
              performance.measure(
                `${listener.name}.onRun()`,
                `${listener.name}.onRun():start`,
                `${listener.name}.onRun():end`
              );
            } catch (error) {
              this.logger
                .error(
                  `🔴 Unable to run listener "${listener.name}" for event "${listener.eventName}".`
                )
                .error(`└─ Reason: ${error.message ?? error}`);
            }
          }
        );
      }
    } catch (error) {
      this.logger
        .error('🔴 Unable to load or run the listeners.')
        .error(`└─ Reason: ${error.message ?? error}`);
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
              .error(`└─ Reason: ${error.message ?? error}`);
          })
        ).default;

        const command = new CommandClass(
          this,
          CommandInstantiationTypes.Client
        ) as Command;
        if (command.disabled) continue;

        this.logger.debug(
          `└─ Registering command "${command.definition.name}"...`
        );
        this.commands.set(command.definition.name, command);
      }
    } catch (error) {
      if (error instanceof BotNotConfiguredException) {
        return;
      }

      if (error instanceof CommandCooldownException) {
        return;
      }

      if (error instanceof CommandNotAllowedException) {
        return;
      }

      this.logger
        .error('🔴 Unable to register the commands.')
        .error(`└─ Reason: ${error.message ?? error}`);
    }
  }

  private async onRedisRemovedKeyEvent(message: string) {
    const [prefix, guildId, userId] = message.split('/');

    switch (prefix) {
      case IdentityPrefixes.GuildAbsences:
        this.onAbsenceRemoved(guildId, userId);
        return;

      case IdentityPrefixes.GuildInboxes:
        this.onInboxRemoved(guildId, userId);
        return;

      default:
        return;
    }
  }

  private async onAbsenceRemoved(guildId: string, userId: string) {
    try {
      const { settings } = (await this.activities.getGuild(guildId)) ?? {};
      const absenceRoleId = (settings as GuildSettings).absenceRoleId ?? null;

      if (absenceRoleId && absenceRoleId !== guildId) {
        const guild = await this.guilds.fetch(guildId);

        try {
          await (await guild.members.fetch(userId)).roles.remove(absenceRoleId);
        } catch {
          /* eslint-disable-line no-empty */
        }
      }
    } catch (error) {
      this.logger.warn(
        `🟠 Unable to inform user "${userId}" about their absence removal for guild "${guildId}".`
      );
      this.logger.warn(`└─ Reason: ${error.message ?? error}`);
    }
  }

  private async onInboxRemoved(guildId: string, userId: string) {
    try {
      const dmChannel = await (
        this.users.cache.get(userId) ?? (await this.users.fetch(userId))
      ).createDM();
      await dmChannel.send({
        embeds: [this.createInboxRemovalDirectMessageEmbed(Locale.EnglishGB)],
      });
    } catch (error) {
      this.logger.warn(
        `🟠 Unable to inform user "${userId}" about their inbox removal for guild "${guildId}".`
      );
      this.logger.warn(`└─ Reason: ${error.message ?? error}`);
    }
  }

  private createInboxRemovalDirectMessageEmbed(guildLocale: Locale.EnglishGB) {
    return new EmbedBuilder()
      .setColor(SecondaryEmbedColor)
      .setAuthor({
        name: this.i18n.t(guildLocale, 'embeds.author'),
        iconURL: EmbedAuthorIconUrl,
      })
      .setURL('https://ollie.gbrlmngr.dev')
      .setTitle(this.i18n.t(guildLocale, 'embeds.inbox_removed.title'))
      .setDescription(
        this.i18n.t(guildLocale, 'embeds.inbox_removed.description')
      );
  }
}
