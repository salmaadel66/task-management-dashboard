import { Injectable, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../../core/environments/environment';
import { Observable } from 'rxjs';
import { Task } from '../../../core/interfaces/task.interface';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/tasks`;

  readonly tasks = httpResource<Task[]>(() => this.url);

  getTaskById(taskId: string): Observable<Task> {
    return this.http.get<Task>(`${this.url}/${taskId}`);
  }

  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(this.url, task);
  }

  updateTask(taskId: string, task: Task): Observable<Task> {
    return this.http.patch<Task>(`${this.url}/${taskId}`, task);
  }

  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${taskId}`);
  }
}
