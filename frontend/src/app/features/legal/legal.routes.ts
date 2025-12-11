import { Routes } from '@angular/router';

export const LEGAL_ROUTES: Routes = [
  {
    path: 'gonka',
    loadComponent: () =>
      import('./gonka-terms.component').then((m) => m.GonkaTermsComponent),
    title: 'GPU Terms for Gonka AI - MineGNK',
  },
  {
    path: '',
    redirectTo: 'gonka',
    pathMatch: 'full',
  },
];
