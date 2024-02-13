import { injectable } from 'inversify';
import MessageFormat, { PrimitiveType } from 'intl-messageformat';
import { has, get } from 'lodash';
import { Locale } from 'discord.js';

import * as translations from '../../translations.json';

@injectable()
export class I18NService {
  public t(
    locale: Locale,
    translationKey: string,
    translationVars: Record<string, void | PrimitiveType> = {}
  ): string {
    const rootLocale = locale.replace(/[-_](.+)$/i, '');
    const translation = get(
      translations[has(translations, rootLocale) ? rootLocale : 'en'],
      translationKey
    );

    return new MessageFormat(
      typeof translation === 'string' ? translation : '\uFFFD',
      locale
    ).format(translationVars) as string;
  }
}
