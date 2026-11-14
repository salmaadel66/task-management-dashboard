import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { HeaderComponent } from './header.component';
import { LanguageService } from '../../core/services/language.service';

@Component({ template: '' })
class DummyComponent {}

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let el: HTMLElement;
  let router: Router;
  let language: { toggle: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    language = { toggle: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideTranslateService(),
        provideRouter([
          { path: 'dashboard', component: DummyComponent },
          { path: 'tasks', component: DummyComponent },
          { path: 'team', component: DummyComponent },
        ]),
        { provide: LanguageService, useValue: language },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(HeaderComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  const navigate = async (url: string) => {
    await router.navigateByUrl(url);
    await fixture.whenStable();
  };

  const searchInput = () => el.querySelector<HTMLInputElement>('.c-search__input');

  it('should show the search box on the dashboard and tasks pages', async () => {
    await navigate('/dashboard');
    expect(searchInput()).not.toBeNull();

    await navigate('/tasks');
    expect(searchInput()).not.toBeNull();
  });

  it('should hide the search box on other pages', async () => {
    await navigate('/team');

    expect(searchInput()).toBeNull();
  });

  it('should fill the search box from the search query param', async () => {
    await navigate('/tasks?search=report');

    expect(fixture.componentInstance.search()).toBe('report');
    expect(searchInput()?.value).toBe('report');
  });

  it('should navigate to tasks with the trimmed search text', async () => {
    await navigate('/dashboard');

    const input = searchInput()!;
    input.value = '  report  ';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(router.url).toBe('/tasks?search=report');
  });

  it('should remove the search param when the text is empty', async () => {
    await navigate('/tasks?search=report');

    fixture.componentInstance.onSearch('   ');
    await fixture.whenStable();

    expect(router.url).toBe('/tasks');
  });

  it('should emit menuClick when the menu button is clicked', () => {
    const spy = vi.fn();
    fixture.componentInstance.menuClick.subscribe(spy);

    (el.querySelector('.l-header__menu') as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalled();
  });

  it('should reflect menuOpen in aria-expanded', async () => {
    const menu = el.querySelector('.l-header__menu')!;
    expect(menu.getAttribute('aria-expanded')).toBe('false');

    fixture.componentRef.setInput('menuOpen', true);
    await fixture.whenStable();

    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(menu.getAttribute('aria-label')).toBe('CLOSE_MENU');
  });

  it('should toggle the language when the language button is clicked', () => {
    (el.querySelector('.l-header__actions .is-outline') as HTMLButtonElement).click();

    expect(language.toggle).toHaveBeenCalled();
  });
});
