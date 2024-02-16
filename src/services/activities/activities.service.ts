import { performance } from 'node:perf_hooks';
import { inject, injectable } from 'inversify';
import { Cache, createCache, memoryStore } from 'cache-manager';
import { Guild, Locale, User } from 'discord.js';
import { crc32 } from 'crc';
import { intersection } from 'lodash';

import {
  BotNotConfiguredException,
  PrismaClient,
  RedisClient,
} from '../../clients';
import { LoggingService } from '../logging';
import { DISymbols } from '../../di.interfaces';
import {
  PlanFeatures,
  PlanIDs,
  PrimaryEmbedColor,
} from '../../shared.interfaces';
import { NODE_ENV } from '../../environment';
import {
  DefaultCacheCapacity,
  DefaultCacheTTLsInSeconds,
  getGuildMemberAbsenceIdentityKey,
  getGuildAbsencesIdentityKey,
  getGuildQueryIdentityKey,
  getGuildInboxesIdentityKey,
  getGuildMemberInboxIdentityKey,
  getMentionableAbsencesIdentityKey,
  IdentityPrefixes,
} from './activities.interfaces';
import { I18NService } from '../i18n';

@injectable()
export class ActivitiesService {
  private readonly cache: Cache;

  public constructor(
    @inject(DISymbols.LoggingService) private readonly logger: LoggingService,
    @inject(DISymbols.I18NService) private readonly i18n: I18NService,
    @inject(DISymbols.PrismaClient) private readonly prisma: PrismaClient,
    @inject(DISymbols.RedisClient) private readonly redis: RedisClient
  ) {
    this.cache = createCache(
      memoryStore({
        ttl: DefaultCacheTTLsInSeconds.MaximumGlobal,
        max: DefaultCacheCapacity,
      })
    );
  }

  public async getGuild(
    guildId: string,
    cacheTTLSeconds: number = DefaultCacheTTLsInSeconds.GuildQuery
  ) {
    performance.mark(`${ActivitiesService.name}.getGuild():start`);

    const value = await this.cache.wrap(
      getGuildQueryIdentityKey(guildId),
      async () => {
        this.logger.debug(
          `📡 Fetching guild "${guildId}" details from the database...`
        );
        return this.prisma.guild.findUnique({
          where: { id: guildId },
          include: { plan: true },
        });
      },
      NODE_ENV === 'development' ? 1 : cacheTTLSeconds * 1e3
    );

    performance.mark(`${ActivitiesService.name}.getGuild():end`);
    performance.measure(
      `${ActivitiesService.name}.getGuild()`,
      `${ActivitiesService.name}.getGuild():start`,
      `${ActivitiesService.name}.getGuild():end`
    );

    return value;
  }

  public async getGuildAbsences(
    guildId: string,
    cacheTTLSeconds: number = DefaultCacheTTLsInSeconds.GuildAbsences
  ) {
    performance.mark(`${ActivitiesService.name}.getGuildAbsences():start`);

    const value = await this.cache.wrap(
      getGuildAbsencesIdentityKey(guildId),
      async () => {
        this.logger.debug(
          `📡 Fetching guild "${guildId}" absences from the database...`
        );
        return (
          await this.redis.scan(
            0,
            'MATCH',
            `${getGuildAbsencesIdentityKey(guildId)}/*`,
            'COUNT',
            50
          )
        )?.[1];
      },
      NODE_ENV === 'development' ? 1 : cacheTTLSeconds * 1e3
    );

    performance.mark(`${ActivitiesService.name}.getGuildAbsences():end`);
    performance.measure(
      `${ActivitiesService.name}.getGuildAbsences()`,
      `${ActivitiesService.name}.getGuildAbsences():start`,
      `${ActivitiesService.name}.getGuildAbsences():end`
    );

    return value;
  }

  public async getGuildInboxes(
    guildId: string,
    cacheTTLSeconds: number = DefaultCacheTTLsInSeconds.GuildInboxes
  ) {
    performance.mark(`${ActivitiesService.name}.getGuildInboxes():start`);

    const value = await this.cache.wrap(
      getGuildInboxesIdentityKey(guildId),
      async () => {
        this.logger.debug(
          `📡 Fetching guild "${guildId}" inboxes from the database...`
        );
        return (
          await this.redis.scan(
            0,
            'MATCH',
            `${getGuildInboxesIdentityKey(guildId)}/*`,
            'COUNT',
            1000
          )
        )?.[1];
      },
      NODE_ENV === 'development' ? 1 : cacheTTLSeconds * 1e3
    );

    performance.mark(`${ActivitiesService.name}.getGuildInboxes():end`);
    performance.measure(
      `${ActivitiesService.name}.getGuildInboxes()`,
      `${ActivitiesService.name}.getGuildInboxes():start`,
      `${ActivitiesService.name}.getGuildInboxes():end`
    );

    return value;
  }

  public async getMentionableAbsences(
    guildId: string,
    mentions: string[],
    cacheTTLSeconds: number = DefaultCacheTTLsInSeconds.MentionableAbsences
  ) {
    performance.mark(
      `${ActivitiesService.name}.getMentionableAbsences():start`
    );
    const mentionsHash = crc32(JSON.stringify(mentions)).toString(16);

    const value = await this.cache.wrap(
      getMentionableAbsencesIdentityKey(guildId, mentionsHash),
      async () => {
        this.logger.debug(
          `📡 Computing guild "${guildId}" mentionable absences for hash "${mentionsHash}"...`
        );

        const absences = (await this.getGuildAbsences(guildId))?.map(
          (absence) =>
            absence
              .replace(`${IdentityPrefixes.GuildAbsences}/`, '')
              .replace(`${guildId}/`, '')
        );

        return [Date.now(), intersection(absences, mentions)] as const;
      },
      NODE_ENV === 'development' ? 1 : cacheTTLSeconds * 1e3
    );

    performance.mark(`${ActivitiesService.name}.getMentionableAbsences():end`);
    performance.measure(
      `${ActivitiesService.name}.getMentionableAbsences()`,
      `${ActivitiesService.name}.getMentionableAbsences():start`,
      `${ActivitiesService.name}.getMentionableAbsences():end`
    );

    return value;
  }

  public async createGuild(guild: Guild, initiator: User) {
    performance.mark(`${ActivitiesService.name}.createGuild():start`);

    const createdGuild = await this.prisma.guild
      .create({
        data: {
          id: guild.id,
          ownerId: guild.ownerId,
          planId: PlanIDs.Free,
          subscriptionId: null,
          settings: {},
          registeredBy: initiator.id,
          registeredAt: new Date(),
        },
      })
      .catch(async (error) => {
        /* Reference: https://www.prisma.io/docs/orm/reference/error-reference#p2002 */
        if (error?.code !== 'P2002') {
          this.logger.debug(
            `🔴 Encountered issues when creating a guild "${guild.id}".`
          );
          this.logger.debug(`└─ Reason: ${error?.message ?? error}`);
        }

        throw error;
      });

    const absenceRole = await guild.roles.create({
      name: this.i18n.t(
        guild.preferredLocale as Locale.EnglishGB,
        'commands.setup.role.name'
      ),
      color: PrimaryEmbedColor,
      hoist: true,
      mentionable: false,
      permissions: [],
      reason: this.i18n.t(
        guild.preferredLocale as Locale.EnglishGB,
        'commands.setup.role.reason'
      ),
    });

    const result = await this.prisma.guild
      .update({
        data: { settings: { absenceRoleId: absenceRole.id } },
        where: { id: createdGuild.id },
        include: { plan: true },
      })
      .catch(async (error) => {
        this.logger.debug(
          `🔴 Encountered issues when updating the absence role for guild "${guild.id}".`
        );
        this.logger.debug(`└─ Reason: ${error?.message ?? error}`);
        throw error;
      });

    await this.cache.set(getGuildQueryIdentityKey(guild.id), result);

    performance.mark(`${ActivitiesService.name}.createGuild():end`);
    performance.measure(
      `${ActivitiesService.name}.createGuild()`,
      `${ActivitiesService.name}.createGuild():start`,
      `${ActivitiesService.name}.createGuild():end`
    );

    return result;
  }

  public async createAbsence(guild: Guild, user: User, duration: number) {
    performance.mark(`${ActivitiesService.name}.createAbsence():start`);

    if (!(await this.getGuild(guild.id))) {
      throw new BotNotConfiguredException();
    }

    const setResult = await this.redis.set(
      getGuildMemberAbsenceIdentityKey(guild.id, user.id),
      Date.now().toString(),
      'EX',
      duration
    );

    if (setResult !== 'OK') {
      this.logger.debug(
        `🔴 Unable to create absence for user "${user.id}" in guild "${guild.id}".`
      );
    }

    await Promise.all([
      this.cache.del(getGuildAbsencesIdentityKey(guild.id)),
      this.cache.del(getGuildMemberAbsenceIdentityKey(guild.id, user.id)),
    ]);

    performance.mark(`${ActivitiesService.name}.createAbsence():end`);
    performance.measure(
      `${ActivitiesService.name}.createAbsence()`,
      `${ActivitiesService.name}.createAbsence():start`,
      `${ActivitiesService.name}.createAbsence():end`
    );

    return setResult === 'OK';
  }

  public async createInbox(guild: Guild, user: User, duration: number) {
    performance.mark(`${ActivitiesService.name}.createInbox():start`);

    if (!(await this.getGuild(guild.id))) {
      throw new BotNotConfiguredException();
    }

    const [{ plan }, inboxes] = await Promise.all([
      this.getGuild(guild.id),
      this.getGuildInboxes(guild.id),
    ]);

    const { inboxesQuota, useUnlimitedInboxes } = (plan?.features ??
      {}) as unknown as PlanFeatures;

    if (!useUnlimitedInboxes && inboxes.length >= inboxesQuota) return false;

    const setResult = await this.redis.set(
      getGuildMemberInboxIdentityKey(guild.id, user.id),
      '',
      'EX',
      duration
    );

    if (setResult !== 'OK') {
      this.logger.debug(
        `🔴 Unable to create inbox for user "${user.id}" in guild "${guild.id}".`
      );
    }

    performance.mark(`${ActivitiesService.name}.createInbox():end`);
    performance.measure(
      `${ActivitiesService.name}.createInbox()`,
      `${ActivitiesService.name}.createInbox():start`,
      `${ActivitiesService.name}.createInbox():end`
    );

    return setResult === 'OK';
  }

  public async removeAbsence(guild: Guild, user: User) {
    performance.mark(`${ActivitiesService.name}.removeAbsence():start`);

    if (!(await this.getGuild(guild.id))) {
      throw new BotNotConfiguredException();
    }

    const [[absenceError, absenceResult], [inboxError, inboxResult]] =
      await this.redis
        .multi()
        .del(getGuildMemberAbsenceIdentityKey(guild.id, user.id))
        .del(getGuildMemberInboxIdentityKey(guild.id, user.id))
        .exec();

    if (absenceError || inboxError) {
      this.logger.debug(
        `🔴 Encountered issues when removing absence for user "${user.id}" in guild "${guild.id}".`
      );
      this.logger.debug(
        `└─ Reason: ${
          (absenceError || inboxError)?.message ?? (absenceError || inboxError)
        }`
      );
    }

    await Promise.all([
      this.cache.del(getGuildAbsencesIdentityKey(guild.id)),
      this.cache.del(getGuildMemberAbsenceIdentityKey(guild.id, user.id)),
      this.cache.del(getGuildInboxesIdentityKey(guild.id)),
      this.cache.del(getGuildMemberInboxIdentityKey(guild.id, user.id)),
    ]);

    performance.mark(`${ActivitiesService.name}.removeAbsence():end`);
    performance.measure(
      `${ActivitiesService.name}.removeAbsence()`,
      `${ActivitiesService.name}.removeAbsence():start`,
      `${ActivitiesService.name}.removeAbsence():end`
    );

    return Boolean(absenceResult && inboxResult);
  }
}
