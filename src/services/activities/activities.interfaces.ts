export enum IdentityPrefixes {
  GuildQuery = 'guilds',
  Absences = 'absences',
  Inboxes = 'inboxes',
  MentionableAbsences = 'mentions',
}

export const DefaultCacheTTLsInSeconds = {
  MaximumGlobal: 8 * 3600,
  GuildQuery: 3600,
  Absences: 600,
  Inboxes: 600,
  MentionableAbsences: 30,
} as const;

export const DefaultCacheCapacity = 32e2 as const;

export const getGuildQueryIdentityKey = (guildId: string) =>
  `${IdentityPrefixes.GuildQuery}/${guildId}`;
export const getAbsencesIdentityKey = (guildId: string) =>
  `${IdentityPrefixes.Absences}/${guildId}`;
export const getGuildMemberAbsenceIdentityKey = (
  guildId: string,
  userId: string
) => `${IdentityPrefixes.Absences}/${guildId}/${userId}`;
export const getInboxesIdentityKey = (guildId: string) =>
  `${IdentityPrefixes.Inboxes}/${guildId}`;
export const getGuildMemberInboxIdentityKey = (
  guildId: string,
  userId: string
) => `${IdentityPrefixes.Inboxes}/${guildId}/${userId}`;
export const getMentionableAbsencesIdentityKey = (
  guildId: string,
  hash: string
) => `${IdentityPrefixes.MentionableAbsences}/${guildId}/${hash}`;
