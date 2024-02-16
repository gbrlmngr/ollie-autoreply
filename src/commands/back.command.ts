import {
  CommandInteraction,
  EmbedBuilder,
  Locale,
  SlashCommandBuilder,
  userMention,
} from 'discord.js';
import { RateLimiterAbstract } from 'rate-limiter-flexible';

import { DiscordClient } from '../clients';
import { NODE_ENV } from '../environment';
import { EmbedAuthorIconUrl, PrimaryEmbedColor } from '../shared.interfaces';
import {
  Command,
  CommandCooldownPointPerSeconds,
  CommandInstantiationTypes,
} from './command.interfaces';

export default class BackCommand implements Command {
  public readonly limiter: RateLimiterAbstract;
  public readonly definition = new SlashCommandBuilder()
    .setName('back')
    .setDescription(
      this.client.i18n.t(Locale.EnglishGB, 'commands.back.description')
    )
    .setDMPermission(false);

  public constructor(
    private readonly client: DiscordClient,
    instantiationType: CommandInstantiationTypes
  ) {
    if (instantiationType === CommandInstantiationTypes.Client) {
      this.limiter = client.rlr({
        storeClient: client.redis,
        points: NODE_ENV === 'development' ? 300 : 1,
        duration: CommandCooldownPointPerSeconds.Back,
      });
    }
  }

  public async onRun(interaction: CommandInteraction) {
    const { guild, user } = interaction;
    await interaction.deferReply();

    if (await this.client.activities.removeAbsence(guild, user)) {
      await interaction.editReply({
        embeds: [this.createUserBackEmbed(Locale.EnglishGB, user.id)],
      });
    } else {
      await interaction.deleteReply();
    }
  }

  private createUserBackEmbed(guildLocale: Locale.EnglishGB, userId: string) {
    return new EmbedBuilder()
      .setColor(PrimaryEmbedColor)
      .setAuthor({
        name: this.client.i18n.t(guildLocale, 'embeds.author'),
        iconURL: EmbedAuthorIconUrl,
      })
      .setTitle(this.client.i18n.t(guildLocale, 'embeds.brb.user_back.title'))
      .setURL('https://ollie.gbrlmngr.dev')
      .setDescription(
        this.client.i18n.t(guildLocale, 'embeds.brb.user_back.description', {
          user: userMention(userId),
        })
      );
  }
}
