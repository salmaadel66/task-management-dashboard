import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';
import { retryInterceptor } from './core/interceptors/retry.interceptor';
import { mockBackendInterceptor } from './core/interceptors/mock-backend.interceptor';
import { environment } from './core/environments/environment';

const interceptors = [cacheInterceptor, retryInterceptor];

if (environment.useMockBackend) {
  interceptors.push(mockBackendInterceptor);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(withInterceptors(interceptors)),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
        fallbackLang: 'en',
      }),
    ),
  ],
};
