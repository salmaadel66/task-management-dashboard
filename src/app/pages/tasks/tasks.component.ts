import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Task } from '../../core/interfaces/task.interface';
import { User } from '../../core/interfaces/user.interface';
import { TasksService } from './services/tasks.service';
import { TaskFormComponent } from './task-form/task-form.component';
import { TaskCardComponent } from './task-card/task-card.component';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-tasks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatMenuModule,
    DragDropModule,
    TaskCardComponent,
    UpperCasePipe,
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
})
export class TasksComponent implements OnInit {
  private tasksService = inject(TasksService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  private queryParams = toSignal(this.route.queryParams, { initialValue: {} as Params });

  tasksResource = this.tasksService.tasks;
  tasks = computed(() => (this.tasksResource.hasValue() ? this.tasksResource.value() : []));
  deleteError = signal(false);
  updateError = signal(false);

  statuses: Task['status'][] = ['todo', 'in_progress', 'done'];
  priorities: Task['priority'][] = ['high', 'medium', 'low'];

  leaveAnimation = signal('u-scale-out');

  activeTab = signal('all');
  selectedPriority = signal('');
  selectedAssignee = signal<User | null>(null);
  search = computed<string>(() => this.queryParams()['search'] ?? '');

  users = computed(() => {
    const users: User[] = [];
    this.tasks().forEach((task) => {
      if (!users.some((user) => user.id === task.assignee.id)) {
        users.push(task.assignee);
      }
    });
    return users;
  });

  filteredTasks = computed(() => {
    const search = this.search().toLowerCase();

    return this.tasks().filter(
      (task) =>
        (!this.selectedPriority() || task.priority === this.selectedPriority()) &&
        (!this.selectedAssignee() || task.assignee.id === this.selectedAssignee()?.id) &&
        (task.title.toLowerCase().includes(search) ||
          task.description.toLowerCase().includes(search)),
    );
  });

  constructor() {
    effect(() => {
      const isNew = this.queryParams()['new'];
      const isReady = this.tasksResource.hasValue() && !this.tasksResource.isLoading();
      if (isNew && isReady) untracked(() => this.openNewTaskForm());
    });
  }

  ngOnInit() {
    this.tasksResource.reload();
  }

  getTasksByStatus(status: Task['status']): Task[] {
    return this.filteredTasks().filter((task) => task.status === status);
  }

  isOverdue(task: Task): boolean {
    const today = new Date().toLocaleDateString('en-CA');
    return task.status !== 'done' && task.dueDate < today;
  }

  drop(event: CdkDragDrop<Task['status']>): void {
    const task: Task = event.item.data;
    const status = event.container.data;
    const movedTask =
      task.status === status
        ? task
        : { ...task, status, completedAt: status === 'done' ? new Date().toISOString() : null };

    const columnTasks = this.getTasksByStatus(status).filter((item) => item.id !== task.id);
    const nextTask = columnTasks[event.currentIndex];
    const tasks = this.tasks().filter((item) => item.id !== task.id);
    const index = nextTask ? tasks.indexOf(nextTask) : tasks.length;
    tasks.splice(index, 0, movedTask);
    this.tasksResource.set(tasks);
    afterNextRender(() => this.leaveAnimation.set('u-scale-out'), { injector: this.injector });

    if (task.status === status) return;

    this.updateError.set(false);
    this.tasksService
      .updateTask(task.id, { ...movedTask, updatedAt: new Date().toISOString() })
      .subscribe({
        error: () => {
          this.updateError.set(true);
          this.tasksResource.reload();
        },
      });
  }

  addTask(): void {
    this.openTaskForm({ title: 'ADD_TASK' });
  }

  editTask(task: Task): void {
    this.openTaskForm({ title: 'EDIT_TASK', task });
  }

  deleteTask(task: Task): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.panelClass = 'sm-dialog';
    dialogConfig.role = 'alertdialog';
    dialogConfig.data = {
      title: 'DELETE_TASK_TITLE',
      message: this.translate.instant('DELETE_TASK_CONFIRM', { title: task.title }),
      confirmText: 'DELETE',
    };

    this.dialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ok) => {
        if (ok) this.confirmDeleteTask(task);
      });
  }

  private openNewTaskForm(): void {
    this.router.navigate([], {
      queryParams: { new: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.addTask();
  }

  private openTaskForm(data: { title: string; task?: Task }): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.panelClass = 'md-dialog';
    dialogConfig.data = { ...data, tasks: this.tasks() };

    this.dialog
      .open(TaskFormComponent, dialogConfig)
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.isChanged) this.tasksResource.reload();
      });
  }

  private confirmDeleteTask(task: Task): void {
    this.deleteError.set(false);

    this.tasksService.deleteTask(task.id).subscribe({
      next: () => this.tasksResource.reload(),
      error: () => this.deleteError.set(true),
    });
  }
}
