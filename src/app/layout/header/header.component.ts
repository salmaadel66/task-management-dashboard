import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  language = inject(LanguageService);
  private router = inject(Router);

  menuOpen = input(false);
  menuClick = output<void>();

  url = signal(this.router.url);

  hasSearch = computed(() => this.url().includes('/dashboard') || this.url().includes('/tasks'));

  search = computed(() => this.router.parseUrl(this.url()).queryParams['search'] ?? '');

  constructor() {
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
}
