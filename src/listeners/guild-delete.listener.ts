import { Events, Guild } from 'discord.js';

import { Listener } from './listener.interfaces';
import { DiscordClient } from '../clients';

export default class GuildDeleteListener
  implements Listener<Events.GuildDelete>
{
  public readonly name = this.constructor.name;
  public readonly eventName = Events.GuildDelete;
  public readonly once = false;

  public constructor(private readonly client: DiscordClient) {}

  public async onRun(guild: Guild) {
    const { id, name } = guild;
    this.client.logger.info(`😓 Left a guild: "${name}" (${id})`);
  }
}
