'use client';

import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const languages: { code: Locale; short: string; label: string }[] = [
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'ru', short: 'RU', label: 'Русский' },
  { code: 'zh', short: '中文', label: '中文' },
];

function isValidLocale(value: string): value is Locale {
  return routing.locales.includes(value as Locale);
}

interface LanguageSwitcherProps {
  showLabels?: boolean;
}

export function LanguageSwitcher({ showLabels = false }: LanguageSwitcherProps) {
  const rawLocale = useLocale();
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : routing.defaultLocale;
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Set cookie to persist locale preference (prevents middleware from auto-detecting)
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;samesite=lax`;

    // Force full page reload to reset HubSpot form state
    // Always use explicit locale prefix (required for static export)
    // Preserve query params (e.g., ?gpu=... on /request-gpu)
    const queryString = typeof window !== 'undefined' ? window.location.search : '';
    const newPath = `/${newLocale}${pathname}${queryString}`;
    window.location.href = newPath;
  };

  return (
    <div className="flex items-center gap-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          aria-label={`Switch language to ${lang.label}`}
          onClick={() => switchLocale(lang.code)}
          className={`px-2 py-1 text-sm rounded transition-colors hover:text-foreground ${
            locale === lang.code
              ? 'text-foreground font-semibold'
              : 'text-muted-foreground'
          }`}
        >
          {showLabels ? lang.label : lang.short}
        </button>
      ))}
    </div>
  );
}
