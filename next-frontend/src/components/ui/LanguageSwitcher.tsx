'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

const languages: { code: Locale; flag: string; label: string }[] = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
];

interface LanguageSwitcherProps {
  showLabels?: boolean;
}

export function LanguageSwitcher({ showLabels = false }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => switchLocale(lang.code)}
          className={`px-2 py-1 text-sm rounded transition-colors ${
            locale === lang.code
              ? 'text-foreground font-semibold'
              : 'text-muted-foreground'
          } ${showLabels ? 'px-3' : ''}`}
        >
          {lang.flag}
          {showLabels && ` ${lang.label}`}
        </button>
      ))}
    </div>
  );
}
