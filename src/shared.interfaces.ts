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
