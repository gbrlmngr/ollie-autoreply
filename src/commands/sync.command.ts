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

export default class SyncCommand implements Command {
  public readonly limiter: RateLimiterAbstract;
  public readonly definition = new SlashCommandBuilder()
    .setName('sync')
    .setDescription(
      this.client.i18n.t(Locale.EnglishGB, 'commands.sync.description')
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
        duration: CommandCooldownPointPerSeconds.Sync,
      });
    }
  }

  public async onRun(interaction: CommandInteraction) {
    const { guild, user } = interaction;
    await interaction.deferReply({ ephemeral: true });

    try {
      await this.limiter.consume(user.id, 1);
      await this.client.activities.purgeGroupCaches(guild.id);
      await interaction.editReply({
        embeds: [this.createSyncedSuccessfully(Locale.EnglishGB)],
      });
    } catch (error) {
      if (!(error instanceof Error)) {
        const { msBeforeNext } = error as RateLimiterRes;
        throw new CommandCooldownException(msBeforeNext);
      }

      throw error;
    }
  }

  private createSyncedSuccessfully(guildLocale: Locale.EnglishGB) {
    return new EmbedBuilder()
      .setColor(SecondaryEmbedColor)
      .setAuthor({
        name: this.client.i18n.t(guildLocale, 'embeds.author'),
        iconURL: EmbedAuthorIconUrl,
      })
      .setTitle(
        this.client.i18n.t(guildLocale, 'embeds.sync.synced_successfully.title')
      )
      .setURL('https://ollie.gbrlmngr.dev')
      .setDescription(
        this.client.i18n.t(
          guildLocale,
          'embeds.sync.synced_successfully.description'
        )
      );
  }
}
