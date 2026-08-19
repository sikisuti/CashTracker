import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    title: 'Kezdőlap',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'transactions',
    title: 'Tranzakciók',
    loadComponent: () =>
      import('./transactions/transaction-list.component').then((m) => m.TransactionListComponent),
  },
  { path: '**', redirectTo: 'home' },
];
