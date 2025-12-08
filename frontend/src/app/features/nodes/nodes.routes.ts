import { Routes } from '@angular/router';

export const NODES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./nodes-list/nodes-list.component').then((m) => m.NodesListComponent),
  },
  {
    path: 'request',
    loadComponent: () =>
      import('./node-request/node-request.component').then(
        (m) => m.NodeRequestComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./node-detail/node-detail.component').then(
        (m) => m.NodeDetailComponent
      ),
  },
];
