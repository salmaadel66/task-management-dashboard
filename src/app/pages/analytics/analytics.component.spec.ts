import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input, signal } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AnalyticsComponent } from './analytics.component';
import { TasksService } from '../tasks/services/tasks.service';
import { Task } from '../../core/interfaces/task.interface';

@Component({ selector: 'apx-chart', template: '' })
class ChartStubComponent {
  series = input<unknown>();
  labels = input<unknown>();
  colors = input<unknown>();
  chart = input<unknown>();
  legend = input<unknown>();
  plotOptions = input<unknown>();
}

function fakeResource<T>(initial?: T) {
  const value = signal<T | undefined>(initial);
  return {
    value,
    error: signal<unknown>(undefined),
    isLoading: signal(false),
    hasValue: () => value() !== undefined,
    reload: vi.fn(),
  };
}

describe('AnalyticsComponent', () => {
  let fixture: ComponentFixture<AnalyticsComponent>;
  let el: HTMLElement;
  let tasks: ReturnType<typeof fakeResource<Task[]>>;

  const task = (
    id: string,
    status: Task['status'],
    priority: Task['priority'],
    updatedAt: string,
    createdAt = '2026-01-01T00:00:00Z',
  ): Task => ({
    id,
    title: `Task ${id}`,
    description: '',
    status,
    priority,
    dueDate: '2999-01-01',
    assignee: { id: 'u1', name: 'Sara', avatar: 'S', email: '' },
    tags: [],
    createdAt,
    updatedAt,
  });

  const allTasks = [
    task('1', 'todo', 'high', '2026-01-01T00:00:00Z'),
    task('2', 'in_progress', 'high', '2026-03-01T00:00:00Z'),
    task('3', 'done', 'low', '2026-02-01T00:00:00Z'),
    task('4', 'todo', 'medium', '2026-04-01T00:00:00Z'),
  ];

  beforeEach(async () => {
    tasks = fakeResource<Task[]>();

    await TestBed.configureTestingModule({
      imports: [AnalyticsComponent],
      providers: [provideTranslateService(), { provide: TasksService, useValue: { tasks } }],
    })
      .overrideComponent(AnalyticsComponent, {
        remove: { imports: [NgApexchartsModule] },
        add: { imports: [ChartStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AnalyticsComponent);
    el = fixture.nativeElement;
  });

  it('should reload tasks on init', async () => {
    await fixture.whenStable();

    expect(tasks.reload).toHaveBeenCalled();
  });

  it('should show a spinner while loading for the first time', async () => {
    tasks.isLoading.set(true);
    await fixture.whenStable();

    expect(el.querySelector('mat-spinner')).not.toBeNull();
  });

  it('should show an error with a retry button', async () => {
    tasks.error.set(new Error('failed'));
    await fixture.whenStable();
    tasks.reload.mockClear();

    const alert = el.querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain('COULD_NOT_LOAD_TASKS');

    (alert.querySelector('button') as HTMLButtonElement).click();
    expect(tasks.reload).toHaveBeenCalled();
  });

  it('should show an empty state when there are no tasks', async () => {
    tasks.value.set([]);
    await fixture.whenStable();

    expect(el.textContent).toContain('NO_TASKS');
    expect(el.querySelector('apx-chart')).toBeNull();
  });

  it('should count tasks by status and priority', () => {
    tasks.value.set(allTasks);
    const component = fixture.componentInstance;

    expect(component.statusCounts()).toEqual([2, 1, 1]);
    expect(component.priorityCounts()).toEqual([2, 1, 1]);
  });

  it('should pass the counts to the charts', async () => {
    tasks.value.set(allTasks);
    await fixture.whenStable();

    const charts = fixture.debugElement
      .queryAll((de) => de.componentInstance instanceof ChartStubComponent)
      .map((de) => de.componentInstance as ChartStubComponent);

    expect(charts.length).toBe(2);
    expect(charts[0].series()).toEqual([2, 1, 1]);
    expect(charts[1].series()).toEqual([2, 1, 1]);
  });

  it('should sort recent activity by last update, newest first', async () => {
    tasks.value.set(allTasks);
    await fixture.whenStable();

    expect(fixture.componentInstance.recentActivity().map((t) => t.id)).toEqual([
      '4',
      '2',
      '3',
      '1',
    ]);
    expect(el.querySelectorAll('.p-analytics__activity-item').length).toBe(4);
  });

  it('should label each activity by what happened to the task', () => {
    const component = fixture.componentInstance;

    expect(component.getAction(task('1', 'done', 'low', '2026-02-01'))).toBe('COMPLETED');
    expect(component.getAction(task('2', 'todo', 'low', '2026-01-01', '2026-01-01'))).toBe(
      'CREATED',
    );
    expect(component.getAction(task('3', 'todo', 'low', '2026-02-01', '2026-01-01'))).toBe(
      'UPDATED',
    );
  });

  it('should format the legend with the series value', () => {
    const formatter = fixture.componentInstance.legend.formatter!;
    const options = { seriesIndex: 1, w: { globals: { series: [3, 5] } } };
    const result = formatter('Done', options as unknown as Parameters<typeof formatter>[1]);

    expect(result).toBe('Done: 5');
  });
});
