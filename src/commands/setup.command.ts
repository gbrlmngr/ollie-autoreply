import {
  CommandInteraction,
  EmbedBuilder,
  Locale,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { RateLimiterAbstract, RateLimiterRes } from 'rate-limiter-flexible';

import { DiscordClient } from '../clients';
import {
  EmbedAuthorIconUrl,
  GuildSettings,
  PlanFeatures,
  PlanIDs,
  SecondaryEmbedColor,
} from '../shared.interfaces';
import { NODE_ENV } from '../environment';
import {
  Command,
  CommandCooldownException,
  CommandCooldownPointPerSeconds,
  CommandInstantiationTypes,
} from './command.interfaces';

export default class SetupCommand implements Command {
  public readonly limiter: RateLimiterAbstract;
  public readonly definition = new SlashCommandBuilder()
    .setName('setup')
    .setDescription(
      this.client.i18n.t(Locale.EnglishGB, 'commands.setup.description')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

  public constructor(
    private readonly client: DiscordClient,
    instantiationType: CommandInstantiationTypes
  ) {
    if (instantiationType === CommandInstantiationTypes.Client) {
      this.limiter = client.rlr({
        storeClient: client.redis,
        points: NODE_ENV === 'development' ? 600 : 1,
        duration: CommandCooldownPointPerSeconds.Setup,
      });
    }
  }

  public async onRun(interaction: CommandInteraction) {
    const { guild, user } = interaction;
    await interaction.deferReply({ ephemeral: true });

    try {
      await this.limiter.consume(user.id, 1);

      const { plan } = await this.client.prisma.guild.create({
        data: {
          id: guild.id,
          ownerId: guild.ownerId,
          planId: PlanIDs.Free,
          subscriptionId: null,
          settings: {} as GuildSettings,
          registeredBy: user.id,
          registeredAt: new Date(),
        },
        include: { plan: true },
      });

      const planFeatures = (plan?.features ?? {}) as unknown as PlanFeatures;

      await interaction.editReply({
        embeds: [
          this.buildSuccessfulSetupEmbed(
            Locale.EnglishGB,
            planFeatures.useUnlimitedInboxes
              ? -1
              : planFeatures.inboxesQuota ?? 0,
            planFeatures.useUnlimitedInboxCapacity
              ? -1
              : planFeatures.inboxCapacity ?? 0
          ),
        ],
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        await interaction.editReply({
          embeds: [this.buildAlreadyEnabledEmbed(Locale.EnglishGB)],
        });
        return;
      }

      if (!(error instanceof Error)) {
        const { msBeforeNext } = error as RateLimiterRes;
        throw new CommandCooldownException(msBeforeNext);
      }

      throw error;
    }
  }

  private buildSuccessfulSetupEmbed(
    guildLocale: Locale.EnglishGB,
    inboxesQuota: number,
    inboxCapacity: number
  ) {
    return new EmbedBuilder()
      .setColor(SecondaryEmbedColor)
      .setAuthor({
        name: this.client.i18n.t(guildLocale, 'embeds.author'),
        iconURL: EmbedAuthorIconUrl,
      })
      .setTitle(this.client.i18n.t(guildLocale, 'embeds.setup.success_title'))
      .setURL('https://ollie.gbrlmngr.dev/faq#setup')
      .setDescription(
        this.client.i18n.t(guildLocale, 'embeds.setup.success_description')
      )
      .setFooter({
        text: this.client.i18n.t(guildLocale, 'embeds.setup.upgrade_footer'),
      })
      .addFields(
        {
          name: this.client.i18n.t(
            guildLocale,
            'embeds.setup.inboxes_quota_field.name'
          ),
          value: this.client.i18n.t(
            guildLocale,
            inboxesQuota === -1
              ? 'embeds.setup.inboxes_quota_field.infinite_value'
              : 'embeds.setup.inboxes_quota_field.value',
            { count: inboxesQuota }
          ),
          inline: true,
        },
        {
          name: this.client.i18n.t(
            guildLocale,
            'embeds.setup.inbox_capacity_field.name'
          ),
          value: this.client.i18n.t(
            guildLocale,
            inboxCapacity === -1
              ? 'embeds.setup.inbox_capacity_field.infinite_value'
              : 'embeds.setup.inbox_capacity_field.value',
            { count: inboxCapacity }
          ),
          inline: true,
        }
      );
  }

  private buildAlreadyEnabledEmbed(guildLocale: Locale.EnglishGB) {
    return new EmbedBuilder()
      .setColor(SecondaryEmbedColor)
      .setAuthor({
        name: this.client.i18n.t(guildLocale, 'embeds.author'),
        iconURL: EmbedAuthorIconUrl,
      })
      .setTitle(
        this.client.i18n.t(guildLocale, 'embeds.setup.already_enabled_title')
      )
      .setURL('https://ollie.gbrlmngr.dev/faq#setup')
      .setDescription(
        this.client.i18n.t(
          guildLocale,
          'embeds.setup.already_enabled_description'
        )
      );
  }
}
