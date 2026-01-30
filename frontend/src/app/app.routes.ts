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
  {
    path: '**',
    redirectTo: '',
  },
];
