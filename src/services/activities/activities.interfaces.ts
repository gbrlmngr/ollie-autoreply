export enum IdentityPrefixes {
  GuildQuery = 'guilds/',
  GuildAbsences = 'absences/',
}

export enum DefaultCacheTTLs {
  MaximumGlobal = 8 * 36e5,
  GuildQuery = 36e5,
  GuildAbsences = 6e4,
}

export const DefaultCacheCapacity = 32e2 as const;

export const getGuildQueryIdentityKey = (guildId: string) =>
  `${IdentityPrefixes.GuildQuery}${guildId}`;
export const getGuildAbsencesIdentityKey = (guildId: string) =>
  `${IdentityPrefixes.GuildAbsences}${guildId}`;
