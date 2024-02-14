import { RateLimiterAbstract } from 'rate-limiter-flexible';
import { CommandInteraction, Locale, SlashCommandBuilder } from 'discord.js';

import { DiscordClient } from '../clients';
import { NODE_ENV } from '../environment';
import { Command, CommandInstantiationTypes } from './command.interfaces';

export default class BrbCommand implements Command {
  public readonly limiter: RateLimiterAbstract;
  public readonly definition = new SlashCommandBuilder()
    .setName('brb')
    .setDescription(
      this.client.i18n.t(Locale.EnglishGB, 'commands.brb.description')
    );

  public constructor(
    private readonly client: DiscordClient,
    instantiationType: CommandInstantiationTypes
  ) {
    if (instantiationType === CommandInstantiationTypes.Client) {
      this.limiter = client.rlr({
        storeClient: client.redis,
        points: NODE_ENV === 'development' ? 300 : 1,
        duration: 30,
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
