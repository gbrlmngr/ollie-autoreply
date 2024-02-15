import { RateLimiterAbstract } from 'rate-limiter-flexible';
import {
  APIApplicationCommandOptionChoice,
  CommandInteraction,
  Locale,
  SlashCommandBuilder,
  userMention,
} from 'discord.js';
import { default as ms } from 'ms';
import { formatDistanceToNowStrict } from 'date-fns';

import { DiscordClient } from '../clients';
import { NODE_ENV } from '../environment';
import { AbsenceDurationValuesInSeconds } from '../shared.interfaces';
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
    await interaction.deferReply({ ephemeral: true });

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

    await interaction.editReply(
      this.client.i18n.t(Locale.EnglishGB, 'commands.brb.description')
    );

    if (isAbsenceCreated) {
      await interaction.followUp({
        content: `${isInboxCreated ? 'HAS INBOX!' : ''}${userMention(
          user.id
        )} will be gone for ${formatDistanceToNowStrict(
          Date.now() + duration * 1e3
        )}.`,
        ephemeral: false,
      });
    }
  }
}
