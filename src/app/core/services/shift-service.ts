import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { CloseShiftDto, OpenShiftDto, Shift } from '../models/shift.model';

@Injectable({ providedIn: 'root' })
export class ShiftService {
  private readonly url = environment.apiUrl;
  private readonly http = inject(HttpClient);

  /** GET /shifts – returns all shifts ordered by startTime desc. */
  getAll(): Observable<Shift[]> {
    return this.http.get<Shift[]>(`${this.url}/shifts`);
  }

  /** POST /shifts/start – opens a new business shift. */
  openShift(dto: OpenShiftDto): Observable<Shift> {
    return this.http.post<Shift>(`${this.url}/shifts/start`, dto);
  }

  /** PATCH /shifts/:id/close – closes the active shift. */
  closeShift(shiftId: string, dto: CloseShiftDto): Observable<Shift> {
    return this.http.post<Shift>(`${this.url}/shifts/${shiftId}/close`, dto);
  }

  /** DELETE /shifts/:id – removes a shift record. */
  deleteShift(shiftId: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/shifts/${shiftId}`);
  }
}
