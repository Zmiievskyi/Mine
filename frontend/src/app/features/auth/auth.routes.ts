import { Routes } from '@angular/router';

/**
 * NOTE: These routes are currently DISABLED.
 * All /auth/* paths redirect to landing page (/) in app.routes.ts.
 * This file is kept for future re-enablement of auth functionality.
 */
export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'oauth-callback',
    loadComponent: () =>
      import('./oauth-callback/oauth-callback.component').then(
        (m) => m.OAuthCallbackComponent
      ),
  },
  {
    path: 'telegram-callback',
    loadComponent: () =>
      import('./telegram-callback/telegram-callback.component').then(
        (m) => m.TelegramCallbackComponent
      ),
  },
  {
    path: 'verify-email',
    // canActivate: [authGuard], // Disabled - routes redirect to landing
    loadComponent: () =>
      import('./verify-email/verify-email.component').then(
        (m) => m.VerifyEmailComponent
      ),
  },
];
