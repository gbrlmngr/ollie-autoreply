import { injectable } from 'inversify';
import MessageFormat, { PrimitiveType } from 'intl-messageformat';
import { get } from 'lodash';
import { type Paths } from 'type-fest';

import * as translations from '../../translations.json';

@injectable()
export class I18NService {
  public t(
    translationKey: Paths<typeof translations>,
    translationVars: Record<string, void | PrimitiveType> = {}
  ) {
    const [locale] = translationKey.split('.');
    const translation = get(translations, translationKey);

    return new MessageFormat(
      typeof translation === 'string' ? translation : '?',
      locale ?? 'en'
    ).format(translationVars);
  }
}
