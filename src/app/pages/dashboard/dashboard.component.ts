import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatisticsService } from './services/statistics.service';
import { TasksService } from '../tasks/services/tasks.service';
import { TasksComponent } from '../tasks/tasks.component';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MatProgressSpinnerModule, TasksComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  statistics = inject(StatisticsService).statistics;

  tasks = inject(TasksService).tasks;

  icons: Record<string, string> = {
    'stat-001': 'dashboard.svg',
    'stat-002': 'tasks.svg',
    'stat-003': 'in-progress.svg',
    'stat-004': 'overdue.svg',
  };

  values = computed(() => {
    const tasks = this.tasks.hasValue() ? this.tasks.value() : [];
    const today = new Date().toLocaleDateString('en-CA');

    return {
      'stat-001': tasks.length,
      'stat-002': tasks.filter((task) => task.status === 'done').length,
      'stat-003': tasks.filter((task) => task.status === 'in_progress').length,
      'stat-004': tasks.filter((task) => task.status !== 'done' && task.dueDate < today).length,
    } as Record<string, number>;
  });

  reload(): void {
    if (this.statistics.error()) this.statistics.reload();
    if (this.tasks.error()) this.tasks.reload();
  }
}
