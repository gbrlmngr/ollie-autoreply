import { performance } from 'node:perf_hooks';
import { inject, injectable } from 'inversify';
import { Cache, createCache, memoryStore } from 'cache-manager';

import { PrismaClient } from '../../clients';
import { LoggingService } from '../logging';
import { DISymbols } from '../../di.interfaces';
import {
  DefaultCacheCapacity,
  DefaultCacheTTLs,
  getGuildQueryCacheKey,
} from './caching.interfaces';

@injectable()
export class CachingService {
  private readonly cache: Cache;

  public constructor(
    @inject(DISymbols.LoggingService) private readonly logger: LoggingService,
    @inject(DISymbols.PrismaClient) private readonly prisma: PrismaClient
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
    cacheTTLSeconds: number = DefaultCacheTTLs.Guilds
  ) {
    performance.mark(`${CachingService.name}.getGuild():start`);

    const value = await this.cache.wrap(
      getGuildQueryCacheKey(guildId),
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
}
