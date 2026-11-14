import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { cacheInterceptor } from './cache.interceptor';

describe('cacheInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  const clearCache = () => {
    http.post('/reset', {}).subscribe();
    httpMock.expectOne('/reset').flush({});
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([cacheInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    clearCache();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send the first GET request to the server', () => {
    let result: unknown;
    http.get('/tasks').subscribe((res) => (result = res));

    httpMock.expectOne('/tasks').flush([{ id: '1' }]);

    expect(result).toEqual([{ id: '1' }]);
  });

  it('should return a cached response for a repeated GET request', () => {
    http.get('/tasks').subscribe();
    httpMock.expectOne('/tasks').flush([{ id: '1' }]);

    let result: unknown;
    http.get('/tasks').subscribe((res) => (result = res));

    httpMock.expectNone('/tasks');
    expect(result).toEqual([{ id: '1' }]);
  });

  it('should cache by url including query params', () => {
    http.get('/tasks', { params: { status: 'todo' } }).subscribe();
    httpMock.expectOne('/tasks?status=todo').flush([]);

    http.get('/tasks', { params: { status: 'done' } }).subscribe();
    httpMock.expectOne('/tasks?status=done').flush([]);
  });

  it('should clear the cache when a non-GET request is sent', () => {
    http.get('/tasks').subscribe();
    httpMock.expectOne('/tasks').flush([{ id: '1' }]);

    http.delete('/tasks/1').subscribe();
    httpMock.expectOne('/tasks/1').flush({});

    let result: unknown;
    http.get('/tasks').subscribe((res) => (result = res));
    httpMock.expectOne('/tasks').flush([]);

    expect(result).toEqual([]);
  });

  it('should not cache failed responses', () => {
    http.get('/tasks').subscribe({ error: () => undefined });
    httpMock.expectOne('/tasks').flush('error', { status: 500, statusText: 'Server Error' });

    http.get('/tasks').subscribe();
    httpMock.expectOne('/tasks').flush([]);
  });

  it('should pass non-GET requests through to the server', () => {
    let result: unknown;
    http.post('/tasks', { title: 'New' }).subscribe((res) => (result = res));

    const req = httpMock.expectOne('/tasks');
    expect(req.request.method).toBe('POST');
    req.flush({ id: '2' });

    expect(result).toEqual({ id: '2' });
  });
});
