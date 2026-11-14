import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { TeamComponent } from './team.component';
import { TasksService } from '../tasks/services/tasks.service';
import { TaskFormComponent } from '../tasks/task-form/task-form.component';
import { Task } from '../../core/interfaces/task.interface';
import { User } from '../../core/interfaces/user.interface';

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

describe('TeamComponent', () => {
  let fixture: ComponentFixture<TeamComponent>;
  let el: HTMLElement;
  let tasks: ReturnType<typeof fakeResource<Task[]>>;
  let dialog: { open: ReturnType<typeof vi.fn> };

  const sara: User = { id: 'u1', name: 'Sara', avatar: 'S', email: 'sara@example.com' };
  const omar: User = { id: 'u2', name: 'Omar', avatar: 'O', email: 'omar@example.com' };

  const task = (id: string, status: Task['status'], assignee: User): Task => ({
    id,
    title: `Task ${id}`,
    description: '',
    status,
    priority: 'medium',
    dueDate: '2999-01-01',
    assignee,
    tags: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  });

  const allTasks = [
    task('1', 'todo', sara),
    task('2', 'in_progress', sara),
    task('3', 'done', sara),
    task('4', 'done', omar),
  ];

  beforeEach(async () => {
    tasks = fakeResource<Task[]>();
    dialog = { open: vi.fn(() => ({ afterClosed: () => of({ isChanged: true }) })) };

    await TestBed.configureTestingModule({
      imports: [TeamComponent],
      providers: [
        provideTranslateService(),
        { provide: TasksService, useValue: { tasks } },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamComponent);
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
    expect(alert.textContent).toContain('COULD_NOT_LOAD_TEAM');

    (alert.querySelector('button') as HTMLButtonElement).click();
    expect(tasks.reload).toHaveBeenCalled();
  });

  it('should show an empty state when there are no members', async () => {
    tasks.value.set([]);
    await fixture.whenStable();

    expect(el.textContent).toContain('NO_TEAM_MEMBERS');
  });

  it('should list each assignee once', async () => {
    tasks.value.set(allTasks);
    await fixture.whenStable();

    expect(fixture.componentInstance.users()).toEqual([sara, omar]);
    const names = Array.from(el.querySelectorAll('.p-team__name')).map((n) =>
      n.textContent?.trim(),
    );
    expect(names).toEqual(['Sara', 'Omar']);
  });

  it('should count tasks per user and status', async () => {
    tasks.value.set(allTasks);
    const component = fixture.componentInstance;

    expect(component.countTasks(sara)).toBe(3);
    expect(component.countTasks(sara, 'in_progress')).toBe(1);
    expect(component.countTasks(sara, 'done')).toBe(1);
    expect(component.countTasks(omar, 'todo')).toBe(0);
  });

  it('should render the task counts for each member', async () => {
    tasks.value.set(allTasks);
    await fixture.whenStable();

    const stats = Array.from(el.querySelectorAll('.p-team__card')[0].querySelectorAll('dd')).map(
      (d) => d.textContent?.trim(),
    );
    expect(stats).toEqual(['3', '1', '1']);
  });

  it('should open the task form with the user preselected', async () => {
    tasks.value.set(allTasks);
    await fixture.whenStable();

    (el.querySelectorAll('.p-team__card button')[1] as HTMLButtonElement).click();

    const [component, config] = dialog.open.mock.calls[0];
    expect(component).toBe(TaskFormComponent);
    expect(config.data).toEqual({ title: 'ADD_TASK', tasks: allTasks, assigneeId: 'u2' });
    expect(config.disableClose).toBe(true);
  });

  it('should reload tasks when the form saved a change', async () => {
    tasks.value.set(allTasks);
    await fixture.whenStable();
    tasks.reload.mockClear();

    fixture.componentInstance.assignTask(sara);

    expect(tasks.reload).toHaveBeenCalled();
  });

  it('should not reload tasks when the form was closed without changes', async () => {
    dialog.open.mockReturnValue({ afterClosed: () => of({ isChanged: false }) });
    await fixture.whenStable();
    tasks.reload.mockClear();

    fixture.componentInstance.assignTask(sara);

    expect(tasks.reload).not.toHaveBeenCalled();
  });
});
