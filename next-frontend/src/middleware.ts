import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only paths that need locale handling
  matcher: ['/', '/(en|ru|zh)/:path*', '/((?!_next|.*\\..*).*)', '/request-gpu']
};
