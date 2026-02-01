import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Only use static export in production build
  ...(isProd && { output: 'export' }),
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  devIndicators: false,
};

export default withNextIntl(nextConfig);
