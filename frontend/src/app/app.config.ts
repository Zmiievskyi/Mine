import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNgcCookieConsent, NgcCookieConsentConfig } from 'ngx-cookieconsent';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { retryInterceptor } from './core/interceptors/retry.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/services/auth.service';

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

/**
 * Initialize auth state on app startup.
 * If user exists in storage, attempts to refresh the access token.
 */
function initializeAuth(): () => Promise<void> {
  const authService = inject(AuthService);
  return () => authService.initializeAuth();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, retryInterceptor, errorInterceptor])
    ),
    provideNgcCookieConsent(cookieConfig),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      multi: true,
    },
  ],
};
