import type {
  Awaitable,
  CommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { RateLimiterAbstract } from 'rate-limiter-flexible';

export interface Command<
  Definition extends Partial<SlashCommandBuilder> = Partial<SlashCommandBuilder>
> {
  readonly definition: Definition;
  readonly limiter: RateLimiterAbstract;
  readonly disabled?: boolean;
  onRun(interaction: CommandInteraction): Awaitable<void>;
}

export enum CommandInstantiationTypes {
  Client = 'client',
  Script = 'script',
}

export enum CommandCooldownPointPerSeconds {
  Setup = 60,
  Brb = 30,
  Back = CommandCooldownPointPerSeconds.Brb,
}
