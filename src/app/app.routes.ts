import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';

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
      },
      {
        path: 'edit-hero/:heroId',
        loadComponent: () => import('./pages/edit-hero-page/edit-hero-page'),
        data: { mode: 'edit' },
      },
      {
        path: 'view-hero/:heroSlug',
        loadComponent: () => import('./pages/edit-hero-page/edit-hero-page'),
        data: { mode: 'view' },
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
