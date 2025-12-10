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
    path: 'nodes',
    loadComponent: () =>
      import('./admin-nodes/admin-nodes.component').then(
        (m) => m.AdminNodesComponent
      ),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./admin-analytics/admin-analytics.component').then(
        (m) => m.AdminAnalyticsComponent
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
  {
    path: 'pricing',
    loadComponent: () =>
      import('./admin-pricing/admin-pricing.component').then(
        (m) => m.AdminPricingComponent
      ),
  },
];
