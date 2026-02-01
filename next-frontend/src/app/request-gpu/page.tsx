'use client';

import { useEffect } from 'react';
import { routing } from '@/i18n/routing';

/**
 * Redirect page for /request-gpu without locale prefix.
 * Uses client-side redirect because server-side redirect() doesn't work with static export.
 * Preserves query parameters (e.g., ?gpu=...) when redirecting.
 */
export default function RequestGpuRedirectPage() {
  useEffect(() => {
    // Check for stored locale preference
    const storedLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1];

    // Use stored preference or default locale
    const targetLocale =
      storedLocale && routing.locales.includes(storedLocale as typeof routing.locales[number])
        ? storedLocale
        : routing.defaultLocale;

    // Preserve query params (e.g., ?gpu=...)
    const queryString = window.location.search;

    // Redirect to locale-prefixed path with trailing slash
    window.location.replace(`/${targetLocale}/request-gpu/${queryString}`);
  }, []);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}
