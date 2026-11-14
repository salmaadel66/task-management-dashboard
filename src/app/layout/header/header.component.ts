import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { Directionality } from '@angular/cdk/bidi';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private router = inject(Router);
  private translate = inject(TranslateService);
  private directionality = inject(Directionality);

  menuOpen = input(false);
  menuClick = output<void>();

  lang = signal(localStorage.getItem('lang') || 'en');

  url = signal(this.router.url);

  hasSearch = computed(() => this.url().includes('/dashboard') || this.url().includes('/tasks'));

  search = computed(() => this.router.parseUrl(this.url()).queryParams['search'] ?? '');

  constructor() {
    this.setLanguage(this.lang());

    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.url.set(event.urlAfterRedirects);
      }
    });
  }

  onSearch(text: string): void {
    this.router.navigate(['/tasks'], {
      queryParams: { search: text.trim() || null },
      replaceUrl: true,
    });
  }

  toggleLanguage(): void {
    this.setLanguage(this.lang() === 'en' ? 'ar' : 'en');
  }

  private setLanguage(lang: string): void {
    this.lang.set(lang);
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    this.directionality.valueSignal.set(dir);
  }
}
