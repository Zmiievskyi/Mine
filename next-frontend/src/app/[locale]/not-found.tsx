'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-accent/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t('pageNotFound')}
        </h1>
        <p className="text-muted-foreground mb-6">
          {t('pageNotFoundDescription')}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-colors duration-200"
        >
          {t('backToHome')}
        </Link>
      </div>
    </div>
  );
}
