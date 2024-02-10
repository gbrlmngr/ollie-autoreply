import type {
  Awaitable,
  CommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';

export interface Command<
  Definition extends SlashCommandBuilder = SlashCommandBuilder
> {
  readonly definition: Definition;
  readonly cooldownSeconds: number;
  readonly disabled?: boolean;
  onRun(interaction: CommandInteraction): Awaitable<void>;
}
