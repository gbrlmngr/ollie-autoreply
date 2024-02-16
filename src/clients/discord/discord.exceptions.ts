export class CommandCooldownException extends Error {
  public constructor(public readonly waitMs: number) {
    super(CommandCooldownException.name);
  }
}

export class CommandNotAllowedException extends Error {}

export class BotNotConfiguredException extends Error {}
