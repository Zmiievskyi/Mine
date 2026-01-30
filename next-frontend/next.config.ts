import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'export', // Static export for SSG
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  devIndicators: false,
};

export default withNextIntl(nextConfig);
