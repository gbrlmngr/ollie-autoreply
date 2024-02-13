import { CacheType, Events, Interaction } from 'discord.js';

import { DiscordClient } from '../clients';
import { CommandCooldownException } from '../commands';
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
        // Send cooldown embed
        this.client.logger.warn(
          'Breaking the cooldown! Wait: %i',
          error.waitMs
        );
        return;
      }

      this.client.logger
        .error(`🔴 Unable to run command "${command.constructor.name}".`)
        .error(`🔴 Reason: ${error.message ?? error}`);
    }
  }
}
