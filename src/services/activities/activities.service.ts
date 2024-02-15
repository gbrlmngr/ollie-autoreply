import { performance } from 'node:perf_hooks';
import { inject, injectable } from 'inversify';
import { Cache, createCache, memoryStore } from 'cache-manager';
import { Guild, User } from 'discord.js';

import { PrismaClient, RedisClient } from '../../clients';
import { LoggingService } from '../logging';
import { DISymbols } from '../../di.interfaces';
import { GuildSettings, PlanIDs } from '../../shared.interfaces';
import {
  DefaultCacheCapacity,
  DefaultCacheTTLs,
  getGuildAbsencesIdentityKey,
  getGuildQueryIdentityKey,
} from './activities.interfaces';

@injectable()
export class ActivitiesService {
  private readonly cache: Cache;

  public constructor(
    @inject(DISymbols.LoggingService) private readonly logger: LoggingService,
    @inject(DISymbols.PrismaClient) private readonly prisma: PrismaClient,
    @inject(DISymbols.RedisClient) private readonly redis: RedisClient
  ) {
    this.cache = createCache(
      memoryStore({
        ttl: DefaultCacheTTLs.MaximumGlobal,
        max: DefaultCacheCapacity,
      })
    );
  }

  public async getGuild(
    guildId: string,
    cacheTTLSeconds: number = DefaultCacheTTLs.GuildQuery
  ) {
    performance.mark(`${ActivitiesService.name}.getGuild():start`);

    const value = await this.cache.wrap(
      getGuildQueryIdentityKey(guildId),
      async () => {
        this.logger.debug(
          `📡 Fetching guild "${guildId}" details from the database...`
        );
        return await this.prisma.guild.findUnique({
          where: { id: guildId },
          include: { plan: true },
        });
      },
      cacheTTLSeconds
    );

    performance.mark(`${ActivitiesService.name}.getGuild():end`);
    performance.measure(
      `${ActivitiesService.name}.getGuild()`,
      `${ActivitiesService.name}.getGuild():start`,
      `${ActivitiesService.name}.getGuild():end`
    );

    return value;
  }

  public async getGuildAbsences(
    guildId: string,
    cacheTTLSeconds: number = DefaultCacheTTLs.GuildAbsences
  ) {
    performance.mark(`${ActivitiesService.name}.getGuildAbsences():start`);

    const value = await this.cache.wrap(
      getGuildAbsencesIdentityKey(guildId),
      async () => {
        this.logger.debug(
          `📡 Fetching guild "${guildId}" absences from the database...`
        );
        return (
          await this.redis.scan(
            0,
            'MATCH',
            `${getGuildAbsencesIdentityKey(guildId)}/*`
          )
        )?.[1];
      },
      cacheTTLSeconds
    );

    performance.mark(`${ActivitiesService.name}.getGuildAbsences():end`);
    performance.measure(
      `${ActivitiesService.name}.getGuildAbsences()`,
      `${ActivitiesService.name}.getGuildAbsences():start`,
      `${ActivitiesService.name}.getGuildAbsences():end`
    );

    return value;
  }

  public async createGuild(guild: Guild, initiator: User) {
    performance.mark(`${ActivitiesService.name}.createGuild():start`);

    const result = await this.prisma.guild
      .create({
        data: {
          id: guild.id,
          ownerId: guild.ownerId,
          planId: PlanIDs.Free,
          subscriptionId: null,
          settings: {} as GuildSettings,
          registeredBy: initiator.id,
          registeredAt: new Date(),
        },
        include: { plan: true },
      })
      .catch(async (error) => {
        /* Reference: https://www.prisma.io/docs/orm/reference/error-reference#p2002 */
        if (error?.code !== 'P2002') {
          this.logger.debug(
            `🔴 Unable to create a new guild for Guild "${guild.id}".`
          );
          this.logger.debug(`└─ Reason: ${error?.message ?? error}`);
          this.logger.debug(
            `└─ Deleting cache for "${getGuildQueryIdentityKey(guild.id)}"`
          );
          await this.cache.del(getGuildQueryIdentityKey(guild.id));
        }

        throw error;
      });

    await this.cache.set(getGuildQueryIdentityKey(guild.id), result);

    performance.mark(`${ActivitiesService.name}.createGuild():end`);
    performance.measure(
      `${ActivitiesService.name}.createGuild()`,
      `${ActivitiesService.name}.createGuild():start`,
      `${ActivitiesService.name}.createGuild():end`
    );

    return result;
  }
}
