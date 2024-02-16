import { RateLimiterAbstract } from 'rate-limiter-flexible';
import {
  APIApplicationCommandOptionChoice,
  CommandInteraction,
  EmbedBuilder,
  Locale,
  SlashCommandBuilder,
  userMention,
} from 'discord.js';
import { default as ms } from 'ms';
import { formatDistanceToNowStrict } from 'date-fns';

import { DiscordClient } from '../clients';
import { NODE_ENV } from '../environment';
import {
  AbsenceDurationValuesInSeconds,
  EmbedAuthorIconUrl,
  PrimaryEmbedColor,
} from '../shared.interfaces';
import {
  Command,
  CommandCooldownPointPerSeconds,
  CommandInstantiationTypes,
} from './command.interfaces';

export default class BrbCommand implements Command {
  public readonly limiter: RateLimiterAbstract;
  public readonly definition = new SlashCommandBuilder()
    .setName('brb')
    .setDescription(
      this.client.i18n.t(Locale.EnglishGB, 'commands.brb.description')
    )
    .setDMPermission(false)
    .addIntegerOption((option) =>
      option
        .setName('duration')
        .setDescription(
          this.client.i18n.t(
            Locale.EnglishGB,
            'commands.brb.duration_option.description'
          )
        )
        .addChoices(
          ...AbsenceDurationValuesInSeconds.map<
            APIApplicationCommandOptionChoice<number>
          >((value) => ({
            name: ms(value * 1e3, { long: true }),
            value,
          }))
        )
        .setRequired(true)
    );

  public constructor(
    private readonly client: DiscordClient,
    instantiationType: CommandInstantiationTypes
  ) {
    if (instantiationType === CommandInstantiationTypes.Client) {
      this.limiter = client.rlr({
        storeClient: client.redis,
        points: NODE_ENV === 'development' ? 300 : 1,
        duration: CommandCooldownPointPerSeconds.Brb,
      });
    }
  }

  public async onRun(interaction: CommandInteraction) {
    const { guild, user, options } = interaction;
    await interaction.deferReply();

    const duration = Number(options.get('duration', true)?.value);
    const [isAbsenceCreated, isInboxCreated] = await Promise.all([
      this.client.activities.createAbsence(
        guild,
        user,
        Number.isNaN(duration) ? 0 : duration
      ),
      this.client.activities.createInbox(
        guild,
        user,
        Number.isNaN(duration) ? 0 : duration
      ),
    ]);

    if (isAbsenceCreated) {
      await interaction.editReply({
        embeds: [
          this.createUserGoneEmbed(
            Locale.EnglishGB,
            user.id,
            duration,
            isInboxCreated
          ),
        ],
      });
    } else {
      /* Trigger the "Out of service" embed */
      throw new Error();
    }
  }

  private createUserGoneEmbed(
    guildLocale: Locale.EnglishGB,
    userId: string,
    duration: number,
    isInboxCreated: boolean
  ) {
    return new EmbedBuilder()
      .setColor(PrimaryEmbedColor)
      .setAuthor({
        name: this.client.i18n.t(guildLocale, 'embeds.author'),
        iconURL: EmbedAuthorIconUrl,
      })
      .setTitle(this.client.i18n.t(guildLocale, 'embeds.brb.user_gone.title'))
      .setURL('https://ollie.gbrlmngr.dev')
      .setDescription(
        this.client.i18n.t(guildLocale, 'embeds.brb.user_gone.description', {
          isInboxCreated,
          user: userMention(userId),
          duration: formatDistanceToNowStrict(Date.now() + duration * 1e3),
        })
      );
  }
}
