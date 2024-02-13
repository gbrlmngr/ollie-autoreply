export const PlanIDs = {
  Free: 'PLAN_FREE',
} as const;

export interface PlanFeatures {
  inboxesQuota: number;
  useUnlimitedInboxes: boolean;
  inboxCapacity: number;
  useUnlimitedInboxCapacity: boolean;
}

export interface GuildSettings {}

export const PrimaryEmbedColor = 0xffa500 as const;
export const SecondaryEmbedColor = 0x00a5ff as const;
export const TernaryEmbedColor = 0xfa0000 as const;
export const EmbedAuthorIconUrl =
  'https://cdn.discordapp.com/app-icons/1198622724340326451/02c4ecd6c38b0fc7b5adb4b4bdc9d6b9.png?size=512' as const;
