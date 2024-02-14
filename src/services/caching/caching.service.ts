import { performance } from 'node:perf_hooks';
import { inject, injectable } from 'inversify';
import { Cache, createCache, memoryStore } from 'cache-manager';

import { PrismaClient, RedisClient } from '../../clients';
import { LoggingService } from '../logging';
import { DISymbols } from '../../di.interfaces';
import {
  DefaultCacheCapacity,
  DefaultCacheTTLs,
  getGuildInboxesIdentityKey,
  getGuildQueryIdentityKey,
} from './caching.interfaces';

@injectable()
export class CachingService {
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
    performance.mark(`${CachingService.name}.getGuild():start`);

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

    performance.mark(`${CachingService.name}.getGuild():end`);
    performance.measure(
      `${CachingService.name}.getGuild()`,
      `${CachingService.name}.getGuild():start`,
      `${CachingService.name}.getGuild():end`
    );

    return value;
  }

  public async getGuildInboxes(
    guildId: string,
    memberId = '*',
    cacheTTLSeconds: number = DefaultCacheTTLs.GuildInboxes
  ) {
    performance.mark(`${CachingService.name}.getGuildInboxes():start`);

    const value = await this.cache.wrap(
      getGuildInboxesIdentityKey(guildId, memberId),
      async () => {
        this.logger.debug(
          `📡 Fetching guild "${guildId}" ${
            memberId === '*' ? 'inboxes' : `inbox for member "${memberId}"`
          } from the database...`
        );
        return (
          await this.redis.scan(
            0,
            'MATCH',
            getGuildInboxesIdentityKey(guildId, memberId)
          )
        )?.[1];
      },
      cacheTTLSeconds
    );

    performance.mark(`${CachingService.name}.getGuildInboxes():end`);
    performance.measure(
      `${CachingService.name}.getGuildInboxes()`,
      `${CachingService.name}.getGuildInboxes():start`,
      `${CachingService.name}.getGuildInboxes():end`
    );

    return value;
  }
}
