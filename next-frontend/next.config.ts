import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: true,
  skipTrailingSlashRedirect: true, // Prevent API routes from being redirected
  images: {
    unoptimized: true,
  },
  devIndicators: false,
};

export default withNextIntl(nextConfig);
