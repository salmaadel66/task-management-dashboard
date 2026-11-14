import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { DashboardComponent } from './dashboard.component';
import { StatisticsService } from './services/statistics.service';
import { TasksService } from '../tasks/services/tasks.service';
import { TasksComponent } from '../tasks/tasks.component';
import { Statistic } from '../../core/interfaces/statistic.interface';
import { Task } from '../../core/interfaces/task.interface';

@Component({ selector: 'app-tasks', template: '' })
class TasksStubComponent {}

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

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let el: HTMLElement;
  let statistics: ReturnType<typeof fakeResource<Statistic[]>>;
  let tasks: ReturnType<typeof fakeResource<Task[]>>;

  const stat = (id: string, title: string, changeType: Statistic['changeType']): Statistic => ({
    id,
    title,
    icon: '',
    value: 0,
    change: '+1',
    changeLabel: 'THIS_WEEK',
    changeType,
    color: '',
  });

  const task = (id: string, status: Task['status'], dueDate: string): Task => ({
    id,
    title: `Task ${id}`,
    description: '',
    status,
    priority: 'medium',
    dueDate,
    assignee: { id: 'u1', name: 'Sara', avatar: 'S', email: '' },
    tags: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  });

  const allStats = [
    stat('stat-001', 'TOTAL_TASKS', 'positive'),
    stat('stat-002', 'COMPLETED', 'positive'),
    stat('stat-003', 'IN_PROGRESS', 'neutral'),
    stat('stat-004', 'OVERDUE', 'negative'),
  ];

  const allTasks = [
    task('1', 'todo', '2999-01-01'),
    task('2', 'todo', '2020-01-01'),
    task('3', 'in_progress', '2020-01-01'),
    task('4', 'done', '2020-01-01'),
    task('5', 'done', '2999-01-01'),
  ];

  beforeEach(async () => {
    statistics = fakeResource<Statistic[]>();
    tasks = fakeResource<Task[]>();

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideTranslateService(),
        { provide: StatisticsService, useValue: { statistics } },
        { provide: TasksService, useValue: { tasks } },
      ],
    })
      .overrideComponent(DashboardComponent, {
        remove: { imports: [TasksComponent] },
        add: { imports: [TasksStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    el = fixture.nativeElement;
  });

  it('should show a spinner while loading', async () => {
    statistics.isLoading.set(true);
    await fixture.whenStable();

    expect(el.querySelector('mat-spinner')).not.toBeNull();
    expect(el.querySelector('.p-dashboard__card')).toBeNull();
  });

  it('should keep the spinner until tasks are loaded', async () => {
    statistics.value.set(allStats);
    await fixture.whenStable();

    expect(el.querySelector('mat-spinner')).not.toBeNull();
  });

  it('should render a card for each statistic with values computed from tasks', async () => {
    statistics.value.set(allStats);
    tasks.value.set(allTasks);
    await fixture.whenStable();

    const values = Array.from(el.querySelectorAll('.p-dashboard__value')).map((v) =>
      v.textContent?.trim(),
    );
    expect(values).toEqual(['5', '2', '1', '2']);
  });

  it('should compute zero values when there are no tasks', () => {
    expect(fixture.componentInstance.values()).toEqual({
      'stat-001': 0,
      'stat-002': 0,
      'stat-003': 0,
      'stat-004': 0,
    });
  });

  it('should hide the change value for neutral statistics', async () => {
    statistics.value.set(allStats);
    tasks.value.set(allTasks);
    await fixture.whenStable();

    const changes = el.querySelectorAll('.p-dashboard__change');
    expect(changes[0].querySelector('bdi')?.textContent).toBe('+1');
    expect(changes[2].querySelector('bdi')).toBeNull();
    expect(changes[3].classList).toContain('is-negative');
  });

  it('should show an error when statistics fail to load', async () => {
    statistics.error.set(new Error('failed'));
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('COULD_NOT_LOAD_STATISTICS');
  });

  it('should show an error when tasks fail to load', async () => {
    tasks.error.set(new Error('failed'));
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('should reload only the failed resources on retry', async () => {
    tasks.error.set(new Error('failed'));
    await fixture.whenStable();

    (el.querySelector('[role="alert"] button') as HTMLButtonElement).click();

    expect(tasks.reload).toHaveBeenCalled();
    expect(statistics.reload).not.toHaveBeenCalled();
  });

  it('should render the tasks board', async () => {
    await fixture.whenStable();

    expect(el.querySelector('app-tasks')).not.toBeNull();
  });
});
