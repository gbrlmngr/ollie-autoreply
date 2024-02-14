import type {
  Awaitable,
  CommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { RateLimiterAbstract } from 'rate-limiter-flexible';

export interface Command<
  Definition extends SlashCommandBuilder = SlashCommandBuilder
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

export class CommandCooldownException extends Error {
  public constructor(public readonly waitMs: number) {
    super(CommandCooldownException.name);
  }
}

export class CommandNotAllowedException extends Error {}
