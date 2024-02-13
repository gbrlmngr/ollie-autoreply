import {
  CommandInteraction,
  Locale,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { RateLimiterAbstract, RateLimiterRes } from 'rate-limiter-flexible';

import { DiscordClient } from '../clients';
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
      points: 0,
      duration: 60,
    });
  }

  public async onRun(interaction: CommandInteraction) {
    const { user } = interaction;
    await interaction.deferReply({ ephemeral: true });

    try {
      await this.limiter.consume(user.id, 1);

      await interaction.editReply('Success!');
    } catch (error) {
      if (!(error instanceof Error)) {
        const { msBeforeNext } = error as RateLimiterRes;
        throw new CommandCooldownException(msBeforeNext);
      }

      throw error;
    }
  }
}
