import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { SidebarComponent } from './sidebar.component';

@Component({ template: '' })
class DummyComponent {}

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let el: HTMLElement;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideTranslateService(),
        provideRouter([
          { path: 'dashboard', component: DummyComponent },
          { path: 'tasks', component: DummyComponent },
          { path: 'analytics', component: DummyComponent },
          { path: 'team', component: DummyComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    el = fixture.nativeElement;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should render a router link for each enabled page', () => {
    const links = Array.from(el.querySelectorAll('a.l-sidebar__link')).map((a) =>
      a.getAttribute('href'),
    );

    expect(links).toEqual(['/dashboard', '/tasks', '/analytics', '/team']);
  });

  it('should render disabled items for links without a path', () => {
    const disabled = Array.from(el.querySelectorAll('.l-sidebar__link.is-disabled'));

    expect(disabled.map((d) => d.textContent?.trim())).toEqual(['CALENDAR', 'SETTINGS']);
    disabled.forEach((d) => expect(d.getAttribute('aria-disabled')).toBe('true'));
  });

  it('should mark the active link', async () => {
    await router.navigateByUrl('/tasks');
    await fixture.whenStable();

    const active = el.querySelector('a.is-active');
    expect(active?.getAttribute('href')).toBe('/tasks');
    expect(active?.getAttribute('aria-current')).toBe('page');
  });

  it('should open the new task form when New Task is clicked', async () => {
    (el.querySelector('button.c-button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(router.url).toBe('/tasks?new=true');
  });
});
