import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { retryInterceptor } from './retry.interceptor';

describe('retryInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([retryInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  const fail = (status: number) =>
    httpMock.expectOne('/tasks').flush('error', { status, statusText: 'Error' });

  it('should retry a GET request after a retryable error and return the result', () => {
    let result: unknown;
    http.get('/tasks').subscribe((res) => (result = res));

    fail(503);
    vi.advanceTimersByTime(500);
    httpMock.expectOne('/tasks').flush([{ id: '1' }]);

    expect(result).toEqual([{ id: '1' }]);
  });

  it('should use exponential backoff between retries', () => {
    http.get('/tasks').subscribe({ error: () => undefined });

    fail(500);

    vi.advanceTimersByTime(499);
    httpMock.expectNone('/tasks');
    vi.advanceTimersByTime(1);
    fail(500);

    vi.advanceTimersByTime(999);
    httpMock.expectNone('/tasks');
    vi.advanceTimersByTime(1);
    fail(500);

    vi.advanceTimersByTime(1999);
    httpMock.expectNone('/tasks');
    vi.advanceTimersByTime(1);
    fail(500);
  });

  it('should give up after 3 retries and emit the error', () => {
    let error: HttpErrorResponse | undefined;
    http.get('/tasks').subscribe({ error: (err) => (error = err) });

    fail(502);
    vi.advanceTimersByTime(500);
    fail(502);
    vi.advanceTimersByTime(1000);
    fail(502);
    vi.advanceTimersByTime(2000);
    fail(502);
    vi.advanceTimersByTime(4000);

    httpMock.expectNone('/tasks');
    expect(error?.status).toBe(502);
  });

  it.each([0, 408, 429, 500, 502, 503, 504])('should retry on status %i', (status) => {
    http.get('/tasks').subscribe({ error: () => undefined });

    fail(status);
    vi.advanceTimersByTime(500);

    httpMock.expectOne('/tasks').flush([]);
  });

  it.each([400, 401, 403, 404])('should not retry on status %i', (status) => {
    let error: HttpErrorResponse | undefined;
    http.get('/tasks').subscribe({ error: (err) => (error = err) });

    fail(status);
    vi.advanceTimersByTime(10000);

    httpMock.expectNone('/tasks');
    expect(error?.status).toBe(status);
  });

  it('should not retry non-GET requests', () => {
    let error: HttpErrorResponse | undefined;
    http.post('/tasks', {}).subscribe({ error: (err) => (error = err) });

    fail(500);
    vi.advanceTimersByTime(10000);

    httpMock.expectNone('/tasks');
    expect(error?.status).toBe(500);
  });
});
