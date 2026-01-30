import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNgcCookieConsent, NgcCookieConsentConfig } from 'ngx-cookieconsent';

import { routes } from './app.routes';

/**
 * Cookie consent configuration.
 * Dark theme to match landing page styling.
 */
const cookieConfig: NgcCookieConsentConfig = {
  cookie: {
    domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  },
  palette: {
    popup: {
      background: '#0a0a0a',
      text: '#ffffff',
    },
    button: {
      background: '#FF4C00',
      text: '#ffffff',
    },
  },
  theme: 'edgeless',
  type: 'info',
  layout: 'basic',
  position: 'bottom-right',
  content: {
    message: 'This website uses cookies to ensure you get the best experience.',
    dismiss: 'Got it!',
    link: 'Learn more',
    href: 'https://gcore.com/legal?tab=cookie_policy',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideNgcCookieConsent(cookieConfig),
  ],
};
