import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ActivatedRoute, Params, Router, provideRouter } from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { TasksComponent } from './tasks.component';
import { TasksService } from './services/tasks.service';
import { TaskFormComponent } from './task-form/task-form.component';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
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
    set: (next: T) => value.set(next),
  };
}

describe('TasksComponent', () => {
  let fixture: ComponentFixture<TasksComponent>;
  let component: TasksComponent;
  let el: HTMLElement;
  let tasks: ReturnType<typeof fakeResource<Task[]>>;
  let tasksService: {
    tasks: typeof tasks;
    updateTask: ReturnType<typeof vi.fn>;
    deleteTask: ReturnType<typeof vi.fn>;
  };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let queryParams: BehaviorSubject<Params>;
  let router: Router;

  const sara: User = { id: 'u1', name: 'Sara', avatar: 'S', email: '' };
  const omar: User = { id: 'u2', name: 'Omar', avatar: 'O', email: '' };

  const task = (id: string, status: Task['status'], overrides: Partial<Task> = {}): Task => ({
    id,
    title: `Task ${id}`,
    description: `Description ${id}`,
    status,
    priority: 'medium',
    dueDate: '2999-01-01',
    assignee: sara,
    tags: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  });

  const allTasks = [
    task('1', 'todo', { priority: 'high', title: 'Write report' }),
    task('2', 'todo', { assignee: omar }),
    task('3', 'in_progress', { priority: 'high', description: 'Fix the report bug' }),
    task('4', 'done', { assignee: omar }),
  ];

  const dialogResult = (result: unknown) => ({ afterClosed: () => of(result) });

  const dropEvent = (item: Task, status: Task['status'], currentIndex: number) =>
    ({ item: { data: item }, container: { data: status }, currentIndex }) as unknown as CdkDragDrop<
      Task['status']
    >;

  beforeEach(async () => {
    tasks = fakeResource<Task[]>();
    tasksService = {
      tasks,
      updateTask: vi.fn(() => of({})),
      deleteTask: vi.fn(() => of({})),
    };
    dialog = { open: vi.fn(() => dialogResult(undefined)) };
    queryParams = new BehaviorSubject<Params>({});

    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: TasksService, useValue: tasksService },
        { provide: MatDialog, useValue: dialog },
        { provide: ActivatedRoute, useValue: { queryParams } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  const columnCounts = () =>
    Array.from(el.querySelectorAll('.p-tasks__column-header .c-badge')).map((b) =>
      b.textContent?.trim(),
    );

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

  it('should render a column per status with its tasks', async () => {
    tasks.value.set(allTasks);
    await fixture.whenStable();

    expect(columnCounts()).toEqual(['2', '1', '1']);
    expect(el.querySelectorAll('app-task-card').length).toBe(4);
  });

  it('should show an empty message in columns without tasks', async () => {
    tasks.value.set([task('1', 'todo')]);
    await fixture.whenStable();

    expect(el.querySelectorAll('.p-tasks__empty').length).toBe(2);
  });

  it('should show only the selected status column', async () => {
    tasks.value.set(allTasks);
    await fixture.whenStable();

    (el.querySelectorAll('.p-tasks__tab')[2] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(el.querySelectorAll('.p-tasks__column').length).toBe(1);
    expect(el.querySelector('.p-tasks__column-title')?.textContent).toContain('IN_PROGRESS');
    expect(el.querySelectorAll('.p-tasks__tab')[2].getAttribute('aria-pressed')).toBe('true');
  });

  it('should build a unique list of assignees', () => {
    tasks.value.set(allTasks);

    expect(component.users()).toEqual([sara, omar]);
  });

  it('should filter by priority', () => {
    tasks.value.set(allTasks);
    component.selectedPriority.set('high');

    expect(component.filteredTasks().map((t) => t.id)).toEqual(['1', '3']);
  });

  it('should filter by assignee', () => {
    tasks.value.set(allTasks);
    component.selectedAssignee.set(omar);

    expect(component.filteredTasks().map((t) => t.id)).toEqual(['2', '4']);
  });

  it('should filter by the search query in title or description', async () => {
    tasks.value.set(allTasks);
    queryParams.next({ search: 'REPORT' });

    expect(component.search()).toBe('REPORT');
    expect(component.filteredTasks().map((t) => t.id)).toEqual(['1', '3']);
  });

  it('should combine filters', () => {
    tasks.value.set(allTasks);
    component.selectedPriority.set('high');
    component.selectedAssignee.set(sara);
    queryParams.next({ search: 'bug' });

    expect(component.filteredTasks().map((t) => t.id)).toEqual(['3']);
  });

  it('should group filtered tasks by status', () => {
    tasks.value.set(allTasks);

    expect(component.getTasksByStatus('todo').map((t) => t.id)).toEqual(['1', '2']);
    expect(component.getTasksByStatus('done').map((t) => t.id)).toEqual(['4']);
  });

  it('should mark open tasks past their due date as overdue', () => {
    expect(component.isOverdue(task('1', 'todo', { dueDate: '2020-01-01' }))).toBe(true);
    expect(component.isOverdue(task('2', 'todo', { dueDate: '2999-01-01' }))).toBe(false);
    expect(component.isOverdue(task('3', 'done', { dueDate: '2020-01-01' }))).toBe(false);
  });

  it('should open the task form in add mode', () => {
    tasks.value.set(allTasks);

    component.addTask();

    const [form, config] = dialog.open.mock.calls[0];
    expect(form).toBe(TaskFormComponent);
    expect(config.data).toEqual({ title: 'ADD_TASK', tasks: allTasks });
  });

  it('should open the task form in edit mode', () => {
    tasks.value.set(allTasks);

    component.editTask(allTasks[0]);

    expect(dialog.open.mock.calls[0][1].data).toEqual({
      title: 'EDIT_TASK',
      task: allTasks[0],
      tasks: allTasks,
    });
  });

  it('should reload tasks after the form saves a change', async () => {
    await fixture.whenStable();
    tasks.reload.mockClear();
    dialog.open.mockReturnValue(dialogResult({ isChanged: true }));

    component.addTask();

    expect(tasks.reload).toHaveBeenCalled();
  });

  it('should not reload tasks when the form is closed without changes', async () => {
    await fixture.whenStable();
    tasks.reload.mockClear();
    dialog.open.mockReturnValue(dialogResult({ isChanged: false }));

    component.addTask();

    expect(tasks.reload).not.toHaveBeenCalled();
  });

  it('should open the new task form from the new query param once tasks are loaded', async () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    queryParams.next({ new: 'true' });
    await fixture.whenStable();
    expect(dialog.open).not.toHaveBeenCalled();

    tasks.value.set(allTasks);
    await fixture.whenStable();

    expect(dialog.open.mock.calls[0][0]).toBe(TaskFormComponent);
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { new: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('should ask for confirmation before deleting', () => {
    component.deleteTask(allTasks[0]);

    const [confirm, config] = dialog.open.mock.calls[0];
    expect(confirm).toBe(ConfirmationDialogComponent);
    expect(config.role).toBe('alertdialog');
    expect(config.data.confirmText).toBe('DELETE');
    expect(tasksService.deleteTask).not.toHaveBeenCalled();
  });

  it('should delete the task and reload when confirmed', async () => {
    await fixture.whenStable();
    tasks.reload.mockClear();
    dialog.open.mockReturnValue(dialogResult(true));

    component.deleteTask(allTasks[0]);

    expect(tasksService.deleteTask).toHaveBeenCalledWith('1');
    expect(tasks.reload).toHaveBeenCalled();
  });

  it('should show an error when deleting fails', async () => {
    tasks.value.set(allTasks);
    dialog.open.mockReturnValue(dialogResult(true));
    tasksService.deleteTask.mockReturnValue(throwError(() => new Error('failed')));

    component.deleteTask(allTasks[0]);
    await fixture.whenStable();

    expect(component.deleteError()).toBe(true);
    expect(el.querySelector('.p-tasks__error')?.textContent).toContain('COULD_NOT_DELETE_TASK');
  });

  it('should move a task to another column and save the new status', async () => {
    tasks.value.set(allTasks);

    component.drop(dropEvent(allTasks[0], 'in_progress', 0));
    await fixture.whenStable();

    expect(component.getTasksByStatus('in_progress').map((t) => t.id)).toEqual(['1', '3']);
    const [id, sent] = tasksService.updateTask.mock.calls[0] as [string, Task];
    expect(id).toBe('1');
    expect(sent.status).toBe('in_progress');
    expect(sent.completedAt).toBeNull();
    expect(sent.updatedAt).not.toBe(allTasks[0].updatedAt);
  });

  it('should set completedAt when a task is moved to done', () => {
    tasks.value.set(allTasks);

    component.drop(dropEvent(allTasks[0], 'done', 1));

    const sent = tasksService.updateTask.mock.calls[0][1] as Task;
    expect(sent.completedAt).toBeTruthy();
    expect(component.getTasksByStatus('done').map((t) => t.id)).toEqual(['4', '1']);
  });

  it('should reorder within a column without saving', () => {
    tasks.value.set(allTasks);

    component.drop(dropEvent(allTasks[1], 'todo', 0));

    expect(component.getTasksByStatus('todo').map((t) => t.id)).toEqual(['2', '1']);
    expect(tasksService.updateTask).not.toHaveBeenCalled();
  });

  it('should show an error and reload when moving a task fails', async () => {
    tasks.value.set(allTasks);
    await fixture.whenStable();
    tasks.reload.mockClear();
    tasksService.updateTask.mockReturnValue(throwError(() => new Error('failed')));

    component.drop(dropEvent(allTasks[0], 'done', 0));
    await fixture.whenStable();

    expect(component.updateError()).toBe(true);
    expect(tasks.reload).toHaveBeenCalled();
    expect(el.querySelector('.p-tasks__error')?.textContent).toContain('COULD_NOT_MOVE_TASK');
  });
});
