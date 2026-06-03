import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivityLog, LogCategory } from '../models/log.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly http = inject(HttpClient);

  fetchLogs(type: LogCategory, from: string, to: string): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${environment.apiUrl}/logs`, {
      params: { type, from, to },
    });
  }
}
