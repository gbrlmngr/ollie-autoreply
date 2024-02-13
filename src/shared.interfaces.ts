export const PlanIDs = {
  Free: 'PLAN_FREE',
} as const;

export interface PlanFeatures {
  useUnlimitedInboxes: boolean;
  inboxesQuota: number;
  inboxCapacity: number;
}

export interface GuildSettings {}
