import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { LineItem, PaginatedSalesResponse, PaymentMethod, SaleItem } from '../models/sale.model';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly url = environment.apiUrl;
  private readonly http = inject(HttpClient);

  /** GET /sales – returns all sales records (legacy, kept for compatibility). */
  getAll(): Observable<SaleItem[]> {
    return this.http.get<SaleItem[]>(`${this.url}/sales`);
  }

  /** GET /sales?page=&limit=&cashierId= – returns a paginated page of sales. */
  getPage(page: number, limit: number, cashierId?: string | null): Observable<PaginatedSalesResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (cashierId) {
      params = params.set('cashierId', cashierId);
    }
    return this.http.get<PaginatedSalesResponse>(`${this.url}/sales`, { params });
  }

  /** POST /sales – adds a new sale record. */
  addSale(sale: SaleItem): Observable<SaleItem> {
    return this.http.post<SaleItem>(`${this.url}/sales`, sale);
  }

  /** PATCH /sales/items/:id/confirm – confirms a line item with a payment method. */
  confirmItem(itemId: string, saleId: string, paymentMethod: PaymentMethod): Observable<LineItem> {
    return this.http.patch<LineItem>(`${this.url}/sales/${saleId}/items/${itemId}/confirm`, {
      paymentMethod,
      confirmed: true,
    });
  }
}
