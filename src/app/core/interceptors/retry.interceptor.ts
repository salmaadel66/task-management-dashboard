import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: 3,

      delay: (error: HttpErrorResponse, retryCount) => {
        const retryableStatus = [0, 408, 429, 500, 502, 503, 504];

        if (retryableStatus.includes(error.status)) {
          const delayTime = 500 * Math.pow(2, retryCount - 1);

          return timer(delayTime);
        }

        return throwError(() => error);
      },
    }),
  );
};
