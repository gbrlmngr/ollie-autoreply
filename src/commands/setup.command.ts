import {
  CommandInteraction,
  EmbedBuilder,
  Locale,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { RateLimiterAbstract, RateLimiterRes } from 'rate-limiter-flexible';

import { DiscordClient, CommandCooldownException } from '../clients';
import { EmbedAuthorIconUrl, SecondaryEmbedColor } from '../shared.interfaces';
import { NODE_ENV } from '../environment';
import {
  Command,
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

      const { features } = await this.client.activities.createGuild(
        guild,
        user
      );
      const {
        useUnlimitedInboxes = false,
        useUnlimitedInboxCapacity = false,
        inboxesQuota = 0,
        inboxCapacity = 0,
      } = features ?? {};

      await interaction.editReply({
        embeds: [
          this.createSetupCompletedSuccessfullyEmbed(
            Locale.EnglishGB,
            useUnlimitedInboxes ? -1 : inboxesQuota ?? 0,
            useUnlimitedInboxCapacity ? -1 : inboxCapacity ?? 0
          ),
        ],
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        await interaction.editReply({
          embeds: [this.createSetupPreviouslyCompletedEmbed(Locale.EnglishGB)],
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

  private createSetupCompletedSuccessfullyEmbed(
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
      .setTitle(
        this.client.i18n.t(
          guildLocale,
          'embeds.setup.completed_successfully.title'
        )
      )
      .setURL('https://ollie.gbrlmngr.dev')
      .setDescription(
        this.client.i18n.t(
          guildLocale,
          'embeds.setup.completed_successfully.description'
        )
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
            'embeds.setup.inboxes_quota_field.value',
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
            'embeds.setup.inbox_capacity_field.value',
            { count: inboxCapacity }
          ),
          inline: true,
        }
      );
  }

  private createSetupPreviouslyCompletedEmbed(guildLocale: Locale.EnglishGB) {
    return new EmbedBuilder()
      .setColor(SecondaryEmbedColor)
      .setAuthor({
        name: this.client.i18n.t(guildLocale, 'embeds.author'),
        iconURL: EmbedAuthorIconUrl,
      })
      .setTitle(
        this.client.i18n.t(
          guildLocale,
          'embeds.setup.previously_completed.title'
        )
      )
      .setURL('https://ollie.gbrlmngr.dev')
      .setDescription(
        this.client.i18n.t(
          guildLocale,
          'embeds.setup.previously_completed.description'
        )
      );
  }
}
