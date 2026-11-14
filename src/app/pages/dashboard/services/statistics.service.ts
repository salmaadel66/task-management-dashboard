import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../core/environments/environment';
import { Statistic } from '../../../core/interfaces/statistic.interface';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  readonly statistics = httpResource<Statistic[]>(() => `${environment.apiUrl}/statistics`);
}
