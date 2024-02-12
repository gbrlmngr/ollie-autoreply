import {
  CommandInteraction,
  Locale,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { DiscordClient } from '../clients';
import * as translations from '../translations.json';
import { Command } from './command.interfaces';

export default class SetupCommand implements Command {
  public readonly definition = new SlashCommandBuilder()
    .setName('setup')
    .setDescription(translations.en.commands.setup.description)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

  public constructor(private readonly client: DiscordClient) {}

  public async onRun(interaction: CommandInteraction) {
    await interaction.reply(
      this.client.i18n.t(Locale.EnglishUS, 'commands.setup.description')
    );
  }
}
