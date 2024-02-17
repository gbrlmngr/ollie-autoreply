import { EmbedBuilder, Events, Locale, Message, userMention } from 'discord.js';

import { Listener } from './listener.interfaces';
import { DiscordClient } from '../clients';
import { EmbedAuthorIconUrl, PrimaryEmbedColor } from '../shared.interfaces';

export default class MessageCreateListener
  implements Listener<Events.MessageCreate>
{
  public readonly name = this.constructor.name;
  public readonly eventName = Events.MessageCreate;
  public readonly once = false;
  public readonly disabled = false;

  public constructor(private readonly client: DiscordClient) {}

  public async onRun(message: Message<boolean>) {
    const { author, guild, mentions, cleanContent, url } = message;
    if (author.bot) return;
    if (!mentions.users.size) return;

    const [timestamp, absences] =
      await this.client.activities.getMentionableAbsences(guild.id, [
        ...mentions.users.keys(),
      ]);

    if (!absences.length) return;

    await this.client.activities.bulkDeliverMessage(guild.id, absences, {
      type: 'message',
      authorId: author.id,
      sentAt: Date.now(),
      url,
      content: cleanContent,
    });

    /* If current timestamp is the same as `timestamp`,
      it means this is the first request in the cache window */
    if (Date.now() - timestamp <= 1e3) {
      await message.reply({
        embeds: [
          this.createUsersGoneEmbed(
            Locale.EnglishGB,
            absences.map((userId) => userMention(userId)).join(' ')
          ),
        ],
        allowedMentions: {
          users: [],
          roles: [],
          repliedUser: true,
        },
      });
    }
  }

  private createUsersGoneEmbed(guildLocale: Locale.EnglishGB, users: string) {
    return new EmbedBuilder()
      .setColor(PrimaryEmbedColor)
      .setAuthor({
        name: this.client.i18n.t(guildLocale, 'embeds.author'),
        iconURL: EmbedAuthorIconUrl,
      })
      .setURL('https://ollie.gbrlmngr.dev')
      .setTitle(this.client.i18n.t(guildLocale, 'embeds.users_gone.title'))
      .setDescription(
        this.client.i18n.t(guildLocale, 'embeds.users_gone.description', {
          users,
        })
      );
  }
}
