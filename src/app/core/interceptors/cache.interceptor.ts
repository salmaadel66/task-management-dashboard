import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

const cache = new Map<string, HttpResponse<unknown>>();

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    cache.clear();
    return next(req);
  }

  const cachedResponse = cache.get(req.urlWithParams);

  if (cachedResponse) {
    return of(cachedResponse);
  }

  return next(req).pipe(
    tap((response) => {
      if (response instanceof HttpResponse) {
        cache.set(req.urlWithParams, response);
      }
    }),
  );
};
