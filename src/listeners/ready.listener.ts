import { Events } from 'discord.js';

import { DiscordClient } from '../clients';
import { Listener } from './listener.interface';

export default class ClientReadyListener
  implements Listener<Events.ClientReady>
{
  public readonly eventName = Events.ClientReady;
  public readonly once = true;

  public async onRun(client: DiscordClient<true>) {
    const { id, displayName } = client.user;
    client.loggingService.info(
      `🔐 Bot successfully logged in as "${displayName}" (${id})`
    );
  }
}
