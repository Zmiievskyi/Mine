'use client';

import { useEffect } from 'react';

interface LocaleHtmlLangProps {
  locale: string;
}

/**
 * Client component that sets the html lang attribute.
 * Required because with static export, the root layout can't dynamically set lang per-page.
 */
export function LocaleHtmlLang({ locale }: LocaleHtmlLangProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
