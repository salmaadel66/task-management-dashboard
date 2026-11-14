import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { TaskFormComponent } from './task-form.component';
import { TasksService } from '../services/tasks.service';
import { Task } from '../../../core/interfaces/task.interface';
import { User } from '../../../core/interfaces/user.interface';

describe('TaskFormComponent', () => {
  let fixture: ComponentFixture<TaskFormComponent>;
  let component: TaskFormComponent;
  let keydown$: Subject<KeyboardEvent>;
  let dialogRef: { close: ReturnType<typeof vi.fn>; keydownEvents: () => Subject<KeyboardEvent> };
  let tasksService: { createTask: ReturnType<typeof vi.fn>; updateTask: ReturnType<typeof vi.fn> };

  const sara: User = { id: 'u1', name: 'Sara', avatar: 'S', email: 'sara@example.com' };
  const omar: User = { id: 'u2', name: 'Omar', avatar: 'O', email: 'omar@example.com' };

  const existing: Task = {
    id: '1',
    title: 'Write tests',
    description: 'Cover the form',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2020-01-01',
    assignee: sara,
    tags: ['testing', 'frontend'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    completedAt: null,
  };

  const tasks: Task[] = [
    existing,
    { ...existing, id: '2', assignee: omar },
    { ...existing, id: '3' },
  ];

  const create = async (data: Record<string, unknown>) => {
    await TestBed.configureTestingModule({
      imports: [TaskFormComponent],
      providers: [
        provideTranslateService(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { tasks, ...data } },
        { provide: TasksService, useValue: tasksService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  };

  const fillValidForm = () => {
    component.taskForm.patchValue({
      title: '  New task  ',
      description: 'Details',
      priority: 'low',
      status: 'todo',
      dueDate: '2999-01-01',
      assigneeId: 'u2',
    });
  };

  beforeEach(() => {
    keydown$ = new Subject<KeyboardEvent>();
    dialogRef = { close: vi.fn(), keydownEvents: () => keydown$ };
    tasksService = {
      createTask: vi.fn(() => of({})),
      updateTask: vi.fn(() => of({})),
    };
  });

  describe('add mode', () => {
    beforeEach(async () => {
      await create({ title: 'ADD_TASK' });
    });

    it('should build a unique list of assignees from the tasks', () => {
      expect(component.users).toEqual([sara, omar]);
    });

    it('should start with default values and an invalid form', () => {
      expect(component.taskForm.value).toEqual({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        assigneeId: '',
        tags: [],
      });
      expect(component.taskForm.invalid).toBe(true);
    });

    it('should render the title and the create button', () => {
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector('h2')?.textContent).toContain('ADD_TASK');
      expect(el.querySelector('button[type="submit"]')?.textContent).toContain('CREATE_TASK');
    });

    it('should reject a blank title', () => {
      component.taskForm.controls.title.setValue('   ');

      expect(component.taskForm.controls.title.hasError('required')).toBe(true);
    });

    it('should reject a due date in the past', () => {
      component.taskForm.controls.dueDate.setValue('2020-01-01');

      expect(component.taskForm.controls.dueDate.hasError('pastDate')).toBe(true);
    });

    it('should accept a due date of today', () => {
      component.taskForm.controls.dueDate.setValue(new Date().toLocaleDateString('en-CA'));

      expect(component.taskForm.controls.dueDate.valid).toBe(true);
    });

    it('should add and remove tags', () => {
      component.addTag('one');
      component.addTag('two');
      component.removeTag(0);

      expect(component.tags.value).toEqual(['two']);
    });

    it('should make an empty tag invalid', () => {
      component.addTag();

      expect(component.tags.at(0).hasError('required')).toBe(true);
    });

    it('should mark all fields as touched and not save an invalid form', () => {
      component.onSubmit();

      expect(component.taskForm.controls.title.touched).toBe(true);
      expect(tasksService.createTask).not.toHaveBeenCalled();
    });

    it('should create a task with the form data and close', () => {
      fillValidForm();
      component.addTag('urgent');

      component.onSubmit();

      const sent = tasksService.createTask.mock.calls[0][0] as Task;
      expect(sent).toMatchObject({
        title: 'New task',
        description: 'Details',
        priority: 'low',
        status: 'todo',
        dueDate: '2999-01-01',
        tags: ['urgent'],
        assignee: omar,
        completedAt: null,
      });
      expect(sent.createdAt).toBe(sent.updatedAt);
      expect(dialogRef.close).toHaveBeenCalledWith({ isChanged: true });
    });

    it('should set completedAt when creating a done task', () => {
      fillValidForm();
      component.taskForm.controls.status.setValue('done');

      component.onSubmit();

      const sent = tasksService.createTask.mock.calls[0][0] as Task;
      expect(sent.completedAt).toBe(sent.updatedAt);
    });

    it('should show an error and stay open when saving fails', async () => {
      tasksService.createTask.mockReturnValue(throwError(() => new Error('failed')));
      fillValidForm();

      component.onSubmit();
      await fixture.whenStable();

      expect(component.saveError()).toBe(true);
      expect(component.isLoading()).toBe(false);
      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    });

    it('should close without changes when the close button is clicked', () => {
      (fixture.nativeElement.querySelector('button[mat-icon-button]') as HTMLButtonElement).click();

      expect(dialogRef.close).toHaveBeenCalledWith({ isChanged: false });
    });

    it('should close without changes when Escape is pressed', () => {
      keydown$.next(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(dialogRef.close).toHaveBeenCalledWith({ isChanged: false });
    });

    it('should not close on Escape while saving', () => {
      component.isLoading.set(true);

      keydown$.next(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    beforeEach(async () => {
      await create({ title: 'EDIT_TASK', task: existing });
    });

    it('should fill the form with the task data', () => {
      expect(component.taskForm.value).toEqual({
        title: 'Write tests',
        description: 'Cover the form',
        priority: 'high',
        status: 'in_progress',
        dueDate: '2020-01-01',
        assigneeId: 'u1',
        tags: ['testing', 'frontend'],
      });
    });

    it('should allow a past due date on an existing task', () => {
      expect(component.taskForm.controls.dueDate.valid).toBe(true);
    });

    it('should render the save changes button', () => {
      expect(fixture.nativeElement.querySelector('button[type="submit"]')?.textContent).toContain(
        'SAVE_CHANGES',
      );
    });

    it('should update the task and keep its id and createdAt', () => {
      component.taskForm.controls.status.setValue('done');

      component.onSubmit();

      const [id, sent] = tasksService.updateTask.mock.calls[0] as [string, Task];
      expect(id).toBe('1');
      expect(sent.id).toBe('1');
      expect(sent.createdAt).toBe(existing.createdAt);
      expect(sent.updatedAt).not.toBe(existing.updatedAt);
      expect(sent.completedAt).toBe(sent.updatedAt);
      expect(tasksService.createTask).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith({ isChanged: true });
    });
  });

  describe('assign mode', () => {
    it('should preselect the given assignee', async () => {
      await create({ title: 'ADD_TASK', assigneeId: 'u2' });

      expect(component.taskForm.controls.assigneeId.value).toBe('u2');
    });
  });
});
