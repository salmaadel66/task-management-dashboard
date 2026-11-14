import { TestBed } from '@angular/core/testing';
import { Directionality } from '@angular/cdk/bidi';
import { TranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let translate: { use: ReturnType<typeof vi.fn> };
  let directionality: { valueSignal: ReturnType<typeof signal<'ltr' | 'rtl'>> };

  const createService = () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslateService, useValue: translate },
        { provide: Directionality, useValue: directionality },
      ],
    });
    return TestBed.inject(LanguageService);
  };

  beforeEach(() => {
    localStorage.clear();
    translate = { use: vi.fn() };
    directionality = { valueSignal: signal<'ltr' | 'rtl'>('ltr') };
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    document.documentElement.dir = '';
  });

  it('should default to English when nothing is stored', () => {
    const service = createService();

    expect(service.lang()).toBe('en');
    expect(translate.use).toHaveBeenCalledWith('en');
    expect(localStorage.getItem('lang')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(directionality.valueSignal()).toBe('ltr');
  });

  it('should restore the stored language on startup', () => {
    localStorage.setItem('lang', 'ar');

    const service = createService();

    expect(service.lang()).toBe('ar');
    expect(translate.use).toHaveBeenCalledWith('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(directionality.valueSignal()).toBe('rtl');
  });

  it('should switch from English to Arabic on toggle', () => {
    const service = createService();

    service.toggle();

    expect(service.lang()).toBe('ar');
    expect(translate.use).toHaveBeenLastCalledWith('ar');
    expect(localStorage.getItem('lang')).toBe('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(directionality.valueSignal()).toBe('rtl');
  });

  it('should switch back to English on a second toggle', () => {
    const service = createService();

    service.toggle();
    service.toggle();

    expect(service.lang()).toBe('en');
    expect(translate.use).toHaveBeenLastCalledWith('en');
    expect(localStorage.getItem('lang')).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(directionality.valueSignal()).toBe('ltr');
  });
});
