import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe, LowerCasePipe, UpperCasePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApexChart, ApexLegend, NgApexchartsModule } from 'ng-apexcharts';
import { Task } from '../../core/interfaces/task.interface';
import { TasksService } from '../tasks/services/tasks.service';

@Component({
  selector: 'app-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgApexchartsModule,
    DatePipe,
    LowerCasePipe,
    UpperCasePipe,
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent implements OnInit {
  tasksResource = inject(TasksService).tasks;

  tasks = computed(() => (this.tasksResource.hasValue() ? this.tasksResource.value() : []));

  statuses: Task['status'][] = ['todo', 'in_progress', 'done'];
  priorities: Task['priority'][] = ['high', 'medium', 'low'];

  chart: ApexChart = {
    type: 'donut',
    height: 280,
    fontFamily: 'Inter, sans-serif',
    accessibility: { enabled: false },
  };

  legend: ApexLegend = {
    position: 'bottom',
    itemMargin: { horizontal: 8 },
    formatter: (name, options) => `${name}: ${options?.w.globals.series[options.seriesIndex]}`,
  };
  statusColors = ['#9e9e9e', '#1976d2', '#388e3c'];
  priorityColors = ['#d32f2f', '#ef6c00', '#689f38'];

  statusCounts = computed(() =>
    this.statuses.map((status) => this.tasks().filter((task) => task.status === status).length),
  );

  priorityCounts = computed(() =>
    this.priorities.map(
      (priority) => this.tasks().filter((task) => task.priority === priority).length,
    ),
  );

  recentActivity = computed(() =>
    [...this.tasks()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );

  getAction(task: Task): string {
    if (task.status === 'done') return 'COMPLETED';
    if (task.createdAt === task.updatedAt) return 'CREATED';
    return 'UPDATED';
  }

  ngOnInit() {
    this.tasksResource.reload();
  }
}
