import {
  CacheType,
  EmbedBuilder,
  Events,
  Interaction,
  Locale,
} from 'discord.js';
import { formatDistanceToNowStrict } from 'date-fns';

import { DiscordClient } from '../clients';
import { CommandCooldownException } from '../commands';
import { EmbedAuthorIconUrl, TernaryEmbedColor } from '../shared.interfaces';
import { Listener } from './listener.interfaces';

export default class ChatInputInteractionCreate
  implements Listener<Events.InteractionCreate>
{
  public readonly name = this.constructor.name;
  public readonly eventName = Events.InteractionCreate;

  public constructor(private readonly client: DiscordClient) {}

  public async onRun(interaction: Interaction<CacheType>) {
    if (!interaction.isChatInputCommand()) return;
    if (!this.client.commands.has(interaction.commandName)) return;

    const command = this.client.commands.get(interaction.commandName);

    try {
      performance.mark(`${command.constructor.name}.onRun():start`);
      await command.onRun(interaction);
      performance.mark(`${command.constructor.name}.onRun():end`);
      performance.measure(
        `${command.constructor.name}.onRun()`,
        `${command.constructor.name}.onRun():start`,
        `${command.constructor.name}.onRun():end`
      );
    } catch (error) {
      if (error instanceof CommandCooldownException) {
        await interaction.editReply({
          embeds: [
            this.buildCommandCooldownEmbed(Locale.EnglishGB, error.waitMs),
          ],
        });
        return;
      }

      this.client.logger
        .error(`🔴 Unable to run command "${command.constructor.name}".`)
        .error(`🔴 Reason: ${error.message ?? error}`);

      await interaction.editReply({
        embeds: [this.buildUnknownExceptionEmbed(Locale.EnglishGB)],
      });
    }
  }

  private buildCommandCooldownEmbed(guildLocale: Locale.EnglishGB, waitMs = 0) {
    return new EmbedBuilder()
      .setColor(TernaryEmbedColor)
      .setAuthor({
        name: this.client.i18n.t(guildLocale, 'embeds.author'),
        iconURL: EmbedAuthorIconUrl,
      })
      .setTitle(this.client.i18n.t(guildLocale, 'embeds.cooldown.title'))
      .setDescription(
        this.client.i18n.t(guildLocale, 'embeds.cooldown.description', {
          wait: formatDistanceToNowStrict(Date.now() + waitMs),
        })
      );
  }

  private buildUnknownExceptionEmbed(guildLocale: Locale.EnglishGB) {
    return new EmbedBuilder()
      .setColor(TernaryEmbedColor)
      .setAuthor({
        name: this.client.i18n.t(guildLocale, 'embeds.author'),
        iconURL: EmbedAuthorIconUrl,
      })
      .setTitle(
        this.client.i18n.t(guildLocale, 'embeds.unknown_exception.title')
      )
      .setDescription(
        this.client.i18n.t(guildLocale, 'embeds.unknown_exception.description')
      );
  }
}
