import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import data from '../../../../moks/db.json';

interface Item {
  id: string;
  [key: string]: unknown;
}

const db: Record<string, Item[]> = structuredClone(data);

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const [collection, id] = req.url.slice(environment.apiUrl.length + 1).split('/');
  const items = db[collection];

  if (!items) {
    return notFound(req.url);
  }

  const index = items.findIndex((item) => item.id === id);
  const needsItem = id || req.method === 'PATCH' || req.method === 'DELETE';

  if (needsItem && index === -1) {
    return notFound(req.url);
  }

  let status = 200;
  let body: unknown = null;

  switch (req.method) {
    case 'GET':
      body = id ? items[index] : [...items];
      break;

    case 'POST': {
      const newItem: Item = { ...(req.body as Item), id: crypto.randomUUID() };
      items.push(newItem);
      status = 201;
      body = newItem;
      break;
    }

    case 'PATCH':
      items[index] = { ...items[index], ...(req.body as Item) };
      body = items[index];
      break;

    case 'DELETE':
      items.splice(index, 1);
      break;
  }

  return of(new HttpResponse({ status, body })).pipe(delay(300));
};

function notFound(url: string): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found', url }));
}
