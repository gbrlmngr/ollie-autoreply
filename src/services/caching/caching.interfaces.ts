export enum CachePrefixes {
  Guilds = 'guilds/',
}

export enum DefaultCacheTTLs {
  MaximumGlobal = 8 * 36e5,
  Guilds = DefaultCacheTTLs.MaximumGlobal,
}

export const DefaultCacheCapacity = 32e2 as const;

export const getGuildQueryCacheKey = (guildId: string) =>
  `${CachePrefixes.Guilds}${guildId}`;
