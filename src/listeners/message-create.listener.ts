import { Events, Message } from 'discord.js';

import { Listener } from './listener.interfaces';
import { DiscordClient } from '../clients';

export default class MessageCreateListener
  implements Listener<Events.MessageCreate>
{
  public readonly name = this.constructor.name;
  public readonly eventName = Events.MessageCreate;
  public readonly once = false;
  public readonly disabled = false;

  public constructor(private readonly client: DiscordClient) {}

  public async onRun(message: Message<boolean>) {
    const { author, guild, mentions } = message;
    if (author.bot) return;
    if (!mentions.users.size) return;

    const [timestamp, absences] =
      await this.client.activities.getMentionableAbsences(guild.id, [
        ...mentions.users.keys(),
      ]);

    /* If current timestamp is the same as `timestamp`,
      it means this is the first request in the cache window */
    if (Date.now() - timestamp <= 1e3) {
      console.log('Out of the window!');
      await message.reply('They are not here.');
    }
  }
}
