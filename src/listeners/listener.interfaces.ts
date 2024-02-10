import type { Awaitable, ClientEvents } from 'discord.js';

export interface Listener<EventName extends keyof ClientEvents> {
  readonly name: string;
  readonly eventName: EventName;
  readonly once?: boolean;
  readonly disabled?: boolean;
  onRun(...args: ClientEvents[EventName]): Awaitable<void>;
}
