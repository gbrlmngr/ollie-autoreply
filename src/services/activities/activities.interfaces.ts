export enum IdentityPrefixes {
  GuildQuery = 'guilds',
  GuildAbsences = 'absences',
  GuildInboxes = 'inboxes',
  MentionableAbsences = 'mentions',
}

export const DefaultCacheTTLs = {
  MaximumGlobal: 8 * 36e5,
  GuildQuery: 36e5,
  GuildAbsences: 6e4,
  GuildInboxes: 6e4,
  MentionableAbsences: 3e4,
} as const;

export const DefaultCacheCapacity = 32e2 as const;

export const getGuildQueryIdentityKey = (guildId: string) =>
  `${IdentityPrefixes.GuildQuery}/${guildId}`;
export const getGuildAbsencesIdentityKey = (guildId: string) =>
  `${IdentityPrefixes.GuildAbsences}/${guildId}`;
export const getGuildMemberAbsenceIdentityKey = (
  guildId: string,
  userId: string
) => `${IdentityPrefixes.GuildAbsences}/${guildId}/${userId}`;
export const getGuildInboxesIdentityKey = (guildId: string) =>
  `${IdentityPrefixes.GuildInboxes}/${guildId}`;
export const getGuildMemberInboxIdentityKey = (
  guildId: string,
  userId: string
) => `${IdentityPrefixes.GuildInboxes}/${guildId}/${userId}`;
export const getMentionableAbsencesIdentityKey = (
  guildId: string,
  hash: string
) => `${IdentityPrefixes.MentionableAbsences}/${guildId}/${hash}`;
