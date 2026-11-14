import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'tasks',
        title: 'Tasks',
        loadComponent: () => import('./pages/tasks/tasks.component').then((m) => m.TasksComponent),
      },
      {
        path: 'analytics',
        title: 'Analytics',
        loadComponent: () =>
          import('./pages/analytics/analytics.component').then((m) => m.AnalyticsComponent),
      },
      {
        path: 'team',
        title: 'Team',
        loadComponent: () => import('./pages/team/team.component').then((m) => m.TeamComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
