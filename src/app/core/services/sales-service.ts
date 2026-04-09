import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { SaleItem } from '../models/sale.model';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly url = environment.apiUrl;
  private readonly http = inject(HttpClient);

  /** GET /sales – returns all sales records. */
  getAll(): Observable<SaleItem[]> {
    return this.http.get<SaleItem[]>(`${this.url}/sales`);
  }

  /** POST /sales – adds a new sale record. */
  addSale(sale: SaleItem): Observable<SaleItem> {
    return this.http.post<SaleItem>(`${this.url}/sales`, sale);
  }
}
