import { performance } from 'node:perf_hooks';
import { inject, injectable } from 'inversify';
import { Cache, createCache, memoryStore } from 'cache-manager';

import { PrismaClient, RedisClient } from '../../clients';
import { LoggingService } from '../logging';
import { DISymbols } from '../../di.interfaces';
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
}
