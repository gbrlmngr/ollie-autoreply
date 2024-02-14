export enum IdentityPrefixes {
  GuildQuery = 'guildquery/',
  GuildInboxes = 'guildinboxes/',
}

export enum DefaultCacheTTLs {
  MaximumGlobal = 8 * 36e5,
  GuildQuery = DefaultCacheTTLs.MaximumGlobal,
  GuildInboxes = 6e4,
}

export const DefaultCacheCapacity = 32e2 as const;

export const getGuildQueryIdentityKey = (guildId: string) =>
  `${IdentityPrefixes.GuildQuery}${guildId}`;
export const getGuildInboxesIdentityKey = (guildId: string, memberId = '*') =>
  `${IdentityPrefixes.GuildInboxes}${guildId}/${memberId}`;
