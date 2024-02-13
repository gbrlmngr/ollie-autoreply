import {
  CommandInteraction,
  EmbedBuilder,
  Locale,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { RateLimiterAbstract, RateLimiterRes } from 'rate-limiter-flexible';

import { DiscordClient } from '../clients';
import { EmbedAuthorIconUrl, SecondaryEmbedColor } from '../shared.interfaces';
import { Command, CommandCooldownException } from './command.interfaces';

export default class SetupCommand implements Command {
  public readonly limiter: RateLimiterAbstract;
  public readonly definition = new SlashCommandBuilder()
    .setName('setup')
    .setDescription(
      this.client.i18n.t(Locale.EnglishGB, 'commands.setup.description')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

  public constructor(private readonly client: DiscordClient) {
    this.limiter = client.rlr({
      storeClient: client.redis,
      points: 1,
      duration: 60,
    });
  }

  public async onRun(interaction: CommandInteraction) {
    const { user } = interaction;
    await interaction.deferReply({ ephemeral: true });

    try {
      await this.limiter.consume(user.id, 1);

      await interaction.editReply({
        embeds: [this.buildSuccessfulSetupEmbed(Locale.EnglishGB, -1, 0)],
      });
    } catch (error) {
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
      .setTitle(this.client.i18n.t(guildLocale, 'embeds.setup.title'))
      .setURL('https://ollie.gbrlmngr.dev/faq#setup')
      .setDescription(
        this.client.i18n.t(guildLocale, 'embeds.setup.description')
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
}
