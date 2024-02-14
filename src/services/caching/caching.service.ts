import { performance } from 'node:perf_hooks';
import { inject, injectable } from 'inversify';
import { Cache, createCache, memoryStore } from 'cache-manager';

import { PrismaClient } from '../../clients';
import { LoggingService } from '../logging';
import { DISymbols } from '../../di.interfaces';
import {
  CachePrefixes,
  DefaultCacheCapacity,
  DefaultCacheTTLs,
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

  public async fetchGuild(
    guildId: string,
    cacheTTLSeconds: number = DefaultCacheTTLs.Guilds
  ) {
    performance.mark(`${CachingService.name}.fetchGuild():start`);

    const value = await this.cache.wrap(
      `${CachePrefixes.Guilds}${guildId}`,
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

    performance.mark(`${CachingService.name}.fetchGuild():end`);
    performance.measure(
      `${CachingService.name}.fetchGuild()`,
      `${CachingService.name}.fetchGuild():start`,
      `${CachingService.name}.fetchGuild():end`
    );

    return value;
  }
}
