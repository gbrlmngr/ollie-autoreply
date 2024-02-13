import { injectable } from 'inversify';
import MessageFormat, { type PrimitiveType } from 'intl-messageformat';
import { has, get } from 'lodash';
import { LocaleString as DiscordLocaleString } from 'discord.js';
import type { Paths, Get } from 'type-fest';

import * as translations from '../../translations.json';

@injectable()
export class I18NService {
  public t<Locale extends DiscordLocaleString>(
    locale: Locale,
    translationKey: Paths<Get<typeof translations, Locale>>,
    translationVars: Record<string, void | PrimitiveType> = {}
  ): string {
    const translation = get(
      has(translations, locale)
        ? translations[locale as string]
        : translations['en-GB'],
      translationKey
    );

    return new MessageFormat(
      typeof translation === 'string' ? translation : '\uFFFD',
      locale
    ).format(translationVars) as string;
  }
}
