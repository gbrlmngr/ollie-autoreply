import type { Awaitable, ClientEvents } from 'discord.js';

export interface Listener<EventName extends keyof ClientEvents> {
  readonly eventName: EventName;
  readonly once?: boolean;
  onRun(...args: ClientEvents[EventName]): Awaitable<void>;
}
