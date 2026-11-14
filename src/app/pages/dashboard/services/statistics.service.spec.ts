import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StatisticsService } from './statistics.service';
import { Statistic } from '../../../core/interfaces/statistic.interface';
import { environment } from '../../../core/environments/environment';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let httpMock: HttpTestingController;

  const statistics: Statistic[] = [
    {
      id: 'total',
      title: 'TOTAL_TASKS',
      icon: 'assignment',
      value: 10,
      change: '+2',
      changeLabel: 'THIS_WEEK',
      changeType: 'positive',
      color: 'primary',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(StatisticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request statistics from the API', async () => {
    TestBed.tick();

    const req = httpMock.expectOne(`${environment.apiUrl}/statistics`);
    expect(req.request.method).toBe('GET');
    req.flush(statistics);

    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.statistics.value()).toEqual(statistics);
    expect(service.statistics.error()).toBeUndefined();
  });

  it('should expose an error when the request fails', async () => {
    TestBed.tick();

    httpMock
      .expectOne(`${environment.apiUrl}/statistics`)
      .flush('error', { status: 500, statusText: 'Server Error' });

    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.statistics.error()).toBeTruthy();
  });
});
