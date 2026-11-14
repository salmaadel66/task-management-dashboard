import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { hasModifierKey } from '@angular/cdk/keycodes';
import { filter } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Task } from '../../../core/interfaces/task.interface';
import { User } from '../../../core/interfaces/user.interface';
import { TasksService } from '../services/tasks.service';

function notBlank(control: AbstractControl): { required: boolean } | null {
  return control.value?.trim() ? null : { required: true };
}

function notPastDate(control: AbstractControl): { pastDate: boolean } | null {
  const today = new Date().toLocaleDateString('en-CA');
  return control.value && control.value < today ? { pastDate: true } : null;
}

@Component({
  selector: 'app-task-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    UpperCasePipe,
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
})
export class TaskFormComponent implements OnInit {
  private tasksService = inject(TasksService);
  private dialogRef = inject(MatDialogRef<TaskFormComponent>);
  private data = inject(MAT_DIALOG_DATA);

  title: string = this.data.title;
  task: Task | undefined = this.data.task;
  tasks: Task[] = this.data.tasks;

  isLoading = signal(false);
  saveError = signal(false);

  priorities = ['high', 'medium', 'low'];
  statuses = ['todo', 'in_progress', 'done'];
  users: User[] = [];

  taskForm = new FormGroup({
    title: new FormControl('', [notBlank]),
    description: new FormControl(''),
    priority: new FormControl('medium', [Validators.required]),
    status: new FormControl('todo', [Validators.required]),
    dueDate: new FormControl('', [Validators.required]),
    assigneeId: new FormControl('', [Validators.required]),
    tags: new FormArray<FormControl>([]),
  });

  get tags(): FormArray<FormControl> {
    return this.taskForm.controls.tags;
  }

  ngOnInit() {
    this.dialogRef
      .keydownEvents()
      .pipe(filter((event) => event.key === 'Escape' && !hasModifierKey(event)))
      .subscribe(() => !this.isLoading() && this.onClose(false));

    this.tasks.forEach((task) => {
      if (!this.users.some((user) => user.id === task.assignee.id)) {
        this.users.push(task.assignee);
      }
    });

    if (this.task) {
      this.populateForm(this.task);
    } else {
      this.taskForm.controls.dueDate.addValidators(notPastDate);
    }

    if (this.data.assigneeId) {
      this.taskForm.patchValue({ assigneeId: this.data.assigneeId });
    }
  }

  populateForm(task: Task): void {
    task.tags.forEach((tag) => this.addTag(tag));

    this.taskForm.setValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      assigneeId: task.assignee.id,
      tags: task.tags,
    });
  }

  addTag(tag = ''): void {
    this.tags.push(new FormControl(tag, [Validators.required]));
  }

  removeTag(index: number): void {
    this.tags.removeAt(index);
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const form = this.taskForm.value;
    const now = new Date().toISOString();

    const dataToSend = {
      ...this.task,
      title: form.title?.trim(),
      description: form.description,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate,
      tags: form.tags,
      assignee: this.users.find((user) => user.id === form.assigneeId),
      createdAt: this.task?.createdAt ?? now,
      updatedAt: now,
      completedAt: form.status === 'done' ? (this.task?.completedAt ?? now) : null,
    } as Task;

    const request = this.task
      ? this.tasksService.updateTask(this.task.id, dataToSend)
      : this.tasksService.createTask(dataToSend);

    this.isLoading.set(true);
    this.saveError.set(false);

    request.subscribe({
      next: () => this.onClose(true),
      error: () => {
        this.isLoading.set(false);
        this.saveError.set(true);
      },
    });
  }

  onClose(isChanged: boolean): void {
    this.dialogRef.close({ isChanged });
  }
}
