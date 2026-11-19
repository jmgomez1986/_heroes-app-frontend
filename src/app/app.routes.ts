import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { canDeactivateGuard } from './shared/guards/can-deactivate.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    children: [
      {
        path: 'heroes',
        loadComponent: () => import('./pages/heroes-page/heroes-page'),
      },
      {
        path: 'new-hero',
        loadComponent: () => import('./pages/new-hero-page/new-hero-page'),
        data: { mode: 'create' },
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'edit-hero/:heroSlug',
        loadComponent: () => import('./pages/edit-hero-page/edit-hero-page'),
        data: { mode: 'edit' },
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'view-hero/:heroSlug',
        loadComponent: () => import('./pages/edit-hero-page/edit-hero-page'),
        data: { mode: 'view' },
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: '**',
        redirectTo: 'heroes',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
