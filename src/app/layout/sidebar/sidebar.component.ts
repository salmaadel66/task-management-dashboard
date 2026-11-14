import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  links = [
    { path: '/dashboard', label: 'DASHBOARD', icon: 'dashboard' },
    { path: '/tasks', label: 'TASKS', icon: 'tasks' },
    { path: '', label: 'CALENDAR', icon: 'calendar' },
    { path: '/analytics', label: 'ANALYTICS', icon: 'analytics' },
    { path: '/team', label: 'TEAM', icon: 'team' },
    { path: '', label: 'SETTINGS', icon: 'settings' },
  ];
}
