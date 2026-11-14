import { Type } from '@angular/core';
import { Route } from '@angular/router';
import { routes } from './app.routes';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { TeamComponent } from './pages/team/team.component';

describe('app routes', () => {
  const shell = routes[0];
  const child = (path: string) => shell.children!.find((route) => route.path === path) as Route;

  it('should render pages inside the layout', () => {
    expect(shell.path).toBe('');
    expect(shell.component).toBe(LayoutComponent);
  });

  it('should redirect the empty path to the dashboard', () => {
    const redirect = child('');

    expect(redirect.redirectTo).toBe('dashboard');
    expect(redirect.pathMatch).toBe('full');
  });

  it('should redirect unknown paths to the root', () => {
    const wildcard = routes.find((route) => route.path === '**');

    expect(wildcard?.redirectTo).toBe('');
  });

  it.each([
    ['dashboard', 'Dashboard', DashboardComponent],
    ['tasks', 'Tasks', TasksComponent],
    ['analytics', 'Analytics', AnalyticsComponent],
    ['team', 'Team', TeamComponent],
  ] as [string, string, Type<unknown>][])(
    'should lazy load the %s page with its title',
    async (path, title, component) => {
      const route = child(path);

      expect(route.title).toBe(title);
      expect(await route.loadComponent!()).toBe(component);
    },
  );
});
