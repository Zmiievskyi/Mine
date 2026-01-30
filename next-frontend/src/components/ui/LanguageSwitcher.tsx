'use client';

import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

const languages: { code: Locale; short: string; label: string }[] = [
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'ru', short: 'RU', label: 'Русский' },
  { code: 'zh', short: '中文', label: '中文' },
];

interface LanguageSwitcherProps {
  showLabels?: boolean;
}

export function LanguageSwitcher({ showLabels = false }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Force full page reload to reset HubSpot form state
    const newPath = newLocale === 'en' ? pathname : `/${newLocale}${pathname}`;
    window.location.href = newPath;
  };

  return (
    <div className="flex items-center gap-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
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
