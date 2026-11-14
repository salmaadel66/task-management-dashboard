import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { TaskCardComponent } from './task-card.component';
import { Task } from '../../../core/interfaces/task.interface';

describe('TaskCardComponent', () => {
  let fixture: ComponentFixture<TaskCardComponent>;
  let el: HTMLElement;

  const task: Task = {
    id: '1',
    title: 'Write tests',
    description: 'Cover the task card',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-12-01',
    assignee: { id: 'u1', name: 'Sara', avatar: 'S', email: 'sara@example.com' },
    tags: ['testing', 'frontend'],
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
  };

  const render = async (value: Task, overdue = false) => {
    fixture.componentRef.setInput('task', value);
    fixture.componentRef.setInput('overdue', overdue);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    el = fixture.nativeElement;
  });

  it('should render the task details', async () => {
    await render(task);

    expect(el.querySelector('.p-tasks__title')?.textContent).toContain('Write tests');
    expect(el.querySelector('.p-tasks__description')?.textContent).toContain('Cover the task card');
    expect(el.querySelector('.c-badge')?.classList).toContain('is-high');
    expect(el.querySelector('.p-tasks__footer')?.textContent).toContain('@Sara');
  });

  it('should render a tag for each task tag', async () => {
    await render(task);

    const tags = Array.from(el.querySelectorAll('.c-tag')).map((t) => t.textContent?.trim());
    expect(tags).toEqual(['testing', 'frontend']);
  });

  it('should hide the tags section when there are no tags', async () => {
    await render({ ...task, tags: [] });

    expect(el.querySelector('.p-tasks__tags')).toBeNull();
  });

  it('should show the due date for an open task', async () => {
    await render(task);

    const date = el.querySelector('.p-tasks__date')!;
    expect(date.textContent).toContain('DUE');
    expect(date.querySelector('img')?.getAttribute('src')).toContain('calendar.svg');
  });

  it('should show the overdue state when overdue is true', async () => {
    await render(task, true);

    const date = el.querySelector('.p-tasks__date')!;
    expect(date.textContent).toContain('OVERDUE');
    expect(date.querySelector('img')?.getAttribute('src')).toContain('overdue.svg');
  });

  it('should show the completed date for a done task', async () => {
    await render({ ...task, status: 'done', completedAt: '2026-11-10' }, true);

    const date = el.querySelector('.p-tasks__date')!;
    expect(date.textContent).toContain('COMPLETED');
    expect(date.textContent).toContain('Nov 10, 2026');
  });

  it('should emit edit with the task when edit is clicked', async () => {
    await render(task);
    const spy = vi.fn();
    fixture.componentInstance.edit.subscribe(spy);

    (el.querySelector('.p-tasks__action') as HTMLButtonElement).click();
    await fixture.whenStable();
    const items = document.querySelectorAll<HTMLButtonElement>('[mat-menu-item]');
    items[0].click();

    expect(spy).toHaveBeenCalledWith(task);
  });

  it('should emit delete with the task when delete is clicked', async () => {
    await render(task);
    const spy = vi.fn();
    fixture.componentInstance.delete.subscribe(spy);

    (el.querySelector('.p-tasks__action') as HTMLButtonElement).click();
    await fixture.whenStable();
    const items = document.querySelectorAll<HTMLButtonElement>('[mat-menu-item]');
    items[1].click();

    expect(spy).toHaveBeenCalledWith(task);
  });
});
