import ko from '../locales/ko.json';
import en from '../locales/en.json';
import type { LocaleStrings } from './types';

class I18n {
  private translations: Record<string, LocaleStrings> = {
    ko,
    en,
  };
  private currentLocale = 'en';

  constructor() {
    this.currentLocale = window.localStorage.getItem('language') || 'en';
    window.addEventListener('languagechange', () => {
      this.currentLocale = window.localStorage.getItem('language') || 'en';
    });
  }

  t(key: string): string {
    const keys = key.split('.');
    let current: any = this.translations[this.currentLocale];

    for (const k of keys) {
      if (current[k] === undefined) {
        return key;
      }
      current = current[k];
    }

    return current;
  }
}

const i18n = new I18n();
export default i18n;
