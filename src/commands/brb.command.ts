import { RateLimiterAbstract } from 'rate-limiter-flexible';
import {
  APIApplicationCommandOptionChoice,
  CommandInteraction,
  Locale,
  SlashCommandBuilder,
} from 'discord.js';
import { default as ms } from 'ms';

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
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription(
          this.client.i18n.t(
            Locale.EnglishGB,
            'commands.brb.message_option.description'
          )
        )
        .setMaxLength(128)
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
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply(
      this.client.i18n.t(Locale.EnglishGB, 'commands.brb.description')
    );
  }
}
