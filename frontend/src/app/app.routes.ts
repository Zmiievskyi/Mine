import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },
  {
    path: 'terms',
    loadChildren: () =>
      import('./features/legal/legal.routes').then((m) => m.LEGAL_ROUTES),
  },
  // Redirect all protected routes to landing page
  {
    path: 'auth',
    redirectTo: '',
    pathMatch: 'prefix',
  },
  {
    path: 'dashboard',
    redirectTo: '',
    pathMatch: 'prefix',
  },
  {
    path: 'nodes',
    redirectTo: '',
    pathMatch: 'prefix',
  },
  {
    path: 'requests',
    redirectTo: '',
    pathMatch: 'prefix',
  },
  {
    path: 'kyc',
    redirectTo: '',
    pathMatch: 'prefix',
  },
  {
    path: 'admin',
    redirectTo: '',
    pathMatch: 'prefix',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
