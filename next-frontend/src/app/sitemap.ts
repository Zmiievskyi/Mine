import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const BASE_URL = 'https://minegnk.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = routing.locales;

  const pages = ['', '/request-gpu'];

  return pages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? ('weekly' as const) : ('monthly' as const),
      priority: page === '' ? 1 : 0.8,
    }))
  );
}
