import {
  CommandInteraction,
  Locale,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { DiscordClient } from '../clients';
import { GuildSettings, PlanIDs } from '../shared.interfaces';
import { Command } from './command.interfaces';

export default class SetupCommand implements Command {
  public readonly definition = new SlashCommandBuilder()
    .setName('setup')
    .setDescription(
      this.client.i18n.t(Locale.EnglishGB, 'commands.setup.description')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

  public constructor(private readonly client: DiscordClient) {}

  public async onRun(interaction: CommandInteraction) {
    const { guild } = interaction;
    await interaction.deferReply({ ephemeral: true });

    try {
      await this.client.prisma.guild.create({
        data: {
          id: guild.id,
          ownerId: guild.ownerId,
          settings: {} as GuildSettings,
          planId: PlanIDs.Free,
          subscriptionId: null,
          registeredAt: new Date(),
        },
      });

      await interaction.editReply('Success!');
    } catch (error) {
      if (error?.code === 'P2002') {
        await interaction.editReply('You are already registered');
        return;
      }

      throw error;
    }
  }
}
