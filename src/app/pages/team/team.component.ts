import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Task } from '../../core/interfaces/task.interface';
import { User } from '../../core/interfaces/user.interface';
import { TasksService } from '../tasks/services/tasks.service';
import { TaskFormComponent } from '../tasks/task-form/task-form.component';

@Component({
  selector: 'app-team',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
})
export class TeamComponent implements OnInit {
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  tasks = inject(TasksService).tasks;

  users = computed(() => {
    const users: User[] = [];
    this.tasks.value()?.forEach((task) => {
      if (!users.some((user) => user.id === task.assignee.id)) {
        users.push(task.assignee);
      }
    });
    return users;
  });

  ngOnInit() {
    this.tasks.reload();
  }

  countTasks(user: User, status?: Task['status']): number {
    return (this.tasks.value() ?? []).filter(
      (task) => task.assignee.id === user.id && (!status || task.status === status),
    ).length;
  }

  assignTask(user: User): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.panelClass = 'md-dialog';
    dialogConfig.data = { title: 'ADD_TASK', tasks: this.tasks.value(), assigneeId: user.id };

    this.dialog
      .open(TaskFormComponent, dialogConfig)
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.isChanged) this.tasks.reload();
      });
  }
}
