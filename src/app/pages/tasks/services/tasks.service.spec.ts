import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TasksService } from './tasks.service';
import { Task } from '../../../core/interfaces/task.interface';
import { environment } from '../../../core/environments/environment';

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/tasks`;

  const task: Task = {
    id: '1',
    title: 'Write tests',
    description: 'Cover the service',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-12-01',
    assignee: { id: 'u1', name: 'Sara', avatar: '', email: 'sara@example.com' },
    tags: ['testing'],
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load the task list through the tasks resource', async () => {
    TestBed.tick();

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([task]);

    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.tasks.value()).toEqual([task]);
  });

  it('should get a task by id', () => {
    let result: Task | undefined;
    service.getTaskById('1').subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${url}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(task);

    expect(result).toEqual(task);
  });

  it('should create a task with POST', () => {
    let result: Task | undefined;
    service.createTask(task).subscribe((res) => (result = res));

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(task);
    req.flush(task);

    expect(result).toEqual(task);
  });

  it('should update a task with PUT', () => {
    const updated = { ...task, status: 'done' as const };
    let result: Task | undefined;
    service.updateTask('1', updated).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${url}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updated);
    req.flush(updated);

    expect(result).toEqual(updated);
  });

  it('should delete a task with DELETE', () => {
    service.deleteTask('1').subscribe();

    const req = httpMock.expectOne(`${url}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
