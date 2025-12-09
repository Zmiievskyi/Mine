import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
  },
  {
    path: 'requests',
    loadComponent: () =>
      import('./admin-requests/admin-requests.component').then(
        (m) => m.AdminRequestsComponent
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./admin-users/admin-users.component').then(
        (m) => m.AdminUsersComponent
      ),
  },
];
