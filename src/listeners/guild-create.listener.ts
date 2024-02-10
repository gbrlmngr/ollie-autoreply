import { inject } from 'inversify';
import { Events, Guild } from 'discord.js';

import { Listener } from './listener.interface';
import { DiscordClient } from '../clients';

export default class GuildCreateListener
  implements Listener<Events.GuildCreate>
{
  public readonly name = this.constructor.name;
  public readonly eventName = Events.GuildCreate;
  public readonly once = false;

  public constructor(
    @inject(DiscordClient) private readonly client: DiscordClient
  ) {}

  public async onRun(guild: Guild) {
    const { id, name } = guild;
    this.client.logger.info(`🥳 Joined a new guild: "${name}" (${id})`);
  }
}
