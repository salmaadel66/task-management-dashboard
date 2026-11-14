import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Directionality } from '@angular/cdk/bidi';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private translate = inject(TranslateService);
  private directionality = inject(Directionality);

  readonly lang = signal(localStorage.getItem('lang') || 'en');

  constructor() {
    this.use(this.lang());
  }

  toggle(): void {
    this.use(this.lang() === 'en' ? 'ar' : 'en');
  }

  private use(lang: string): void {
    this.lang.set(lang);
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    this.directionality.valueSignal.set(dir);
  }
}
