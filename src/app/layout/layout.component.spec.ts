import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { LayoutComponent } from './layout.component';
import { LanguageService } from '../core/services/language.service';

describe('LayoutComponent', () => {
  let fixture: ComponentFixture<LayoutComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: LanguageService, useValue: { toggle: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  const sidebar = () => el.querySelector('.l-app__sidebar')!;
  const backdrop = () => el.querySelector('.l-app__backdrop');

  it('should render the header, sidebar and router outlet', () => {
    expect(el.querySelector('app-header')).not.toBeNull();
    expect(el.querySelector('app-sidebar')).not.toBeNull();
    expect(el.querySelector('router-outlet')).not.toBeNull();
  });

  it('should start with the sidebar open and a backdrop', () => {
    expect(sidebar().classList).not.toContain('is-closed');
    expect(backdrop()).not.toBeNull();
  });

  it('should toggle the sidebar when the header menu is clicked', async () => {
    const menu = el.querySelector('.l-header__menu') as HTMLButtonElement;

    menu.click();
    await fixture.whenStable();
    expect(sidebar().classList).toContain('is-closed');
    expect(backdrop()).toBeNull();

    menu.click();
    await fixture.whenStable();
    expect(sidebar().classList).not.toContain('is-closed');
  });

  it('should close the sidebar when the close button is clicked', async () => {
    (el.querySelector('.l-app__close') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(fixture.componentInstance.isClosed()).toBe(true);
  });

  it('should close the sidebar when the backdrop is clicked', async () => {
    (backdrop() as HTMLElement).click();
    await fixture.whenStable();

    expect(sidebar().classList).toContain('is-closed');
  });

  it('should close the sidebar when Escape is pressed', async () => {
    el.querySelector('.l-app__body')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape' }),
    );
    await fixture.whenStable();

    expect(fixture.componentInstance.isClosed()).toBe(true);
  });
});
