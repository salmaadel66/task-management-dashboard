import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Task } from '../../../core/interfaces/task.interface';

@Component({
  selector: 'app-task-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MatIconModule, MatMenuModule, DatePipe, UpperCasePipe],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
})
export class TaskCardComponent {
  task = input.required<Task>();
  overdue = input(false);

  edit = output<Task>();
  delete = output<Task>();
}
