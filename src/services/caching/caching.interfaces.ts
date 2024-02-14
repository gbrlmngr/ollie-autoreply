export enum CachePrefixes {
  Guilds = 'guilds/',
}

export enum DefaultCacheTTLs {
  MaximumGlobal = 8 * 36e5,
  Guilds = 6e4,
}

export const DefaultCacheCapacity = 1e4 as const;
