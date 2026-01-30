import { Injectable, signal, computed } from '@angular/core';
import { en, ru, type Translations } from './translations';

export type SupportedLanguage = 'en' | 'ru';

const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en,
  ru,
};

const STORAGE_KEY = 'minegnk_lang';

/**
 * Internationalization service for MineGNK
 *
 * Provides reactive translations with language switching support.
 * Persists language preference to localStorage.
 */
@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly currentLang = signal<SupportedLanguage>(this.getInitialLanguage());

  public readonly lang = this.currentLang.asReadonly();
  public readonly t = computed(() => TRANSLATIONS[this.currentLang()]);

  /**
   * Available languages for the language switcher
   */
  public readonly availableLanguages: ReadonlyArray<{
    code: SupportedLanguage;
    label: string;
    flag: string;
  }> = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  ];

  /**
   * Switch to a different language
   */
  public setLanguage(lang: SupportedLanguage): void {
    this.currentLang.set(lang);
    this.persistLanguage(lang);
    document.documentElement.lang = lang;
  }

  /**
   * Get the initial language based on:
   * 1. Stored preference
   * 2. Browser language
   * 3. Default to English
   */
  private getInitialLanguage(): SupportedLanguage {
    // Check localStorage first
    const stored = this.getStoredLanguage();
    if (stored) {
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'ru') {
      return 'ru';
    }

    return 'en';
  }

  private getStoredLanguage(): SupportedLanguage | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'en' || stored === 'ru')) {
        return stored;
      }
    } catch {
      // localStorage not available
    }
    return null;
  }

  private persistLanguage(lang: SupportedLanguage): void {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage not available
    }
  }
}
