import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { LineItem, PaymentMethod, SaleItem } from '../models/sale.model';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly url = environment.apiUrl;
  private readonly http = inject(HttpClient);

  /** GET /sales — returns all sales records, with optional cashier filter. */
  getAll(cashierId?: string | null): Observable<SaleItem[]> {
    let params = new HttpParams();
    if (cashierId) {
      params = params.set('cashierId', cashierId);
    }
    return this.http.get<SaleItem[]>(`${this.url}/sales`, { params });
  }

  /** POST /sales – adds a new sale record. */
  addSale(sale: SaleItem): Observable<SaleItem> {
    return this.http.post<SaleItem>(`${this.url}/sales`, sale);
  }

  /** PATCH /sales/:saleId/items/:itemId/confirm – confirms a line item with a payment method. */
  confirmItem(itemId: string, saleId: string, paymentMethod: PaymentMethod): Observable<LineItem> {
    return this.http.patch<LineItem>(`${this.url}/sales/${saleId}/items/${itemId}/confirm`, {
      paymentMethod,
      confirmed: true,
    });
  }

  unconfirmItem(itemId: string, saleId: string): Observable<LineItem> {
    return this.http.patch<LineItem>(`${this.url}/sales/${saleId}/items/${itemId}/unconfirm`, {
      paymentMethod: null,
      confirmed: false,
    });
  }

  /** DELETE /sales/:saleId/items/:itemId – removes a single line item from a sale. */
  deleteLineItem(saleId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/sales/${saleId}/items/${itemId}`);
  }
}
