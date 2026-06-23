import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { LineItem, PaymentMethod, SaleItem } from '../models/sale.model';
import { MpesaMessage } from '../models/mpesa-message.model';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly url = environment.apiUrl;
  private readonly http = inject(HttpClient);

  /** GET /sales — returns all sales records, with optional date range and cashier filters. */
  getAll(options?: {
    cashierId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }): Observable<SaleItem[]> {
    let params = new HttpParams();
    if (options?.cashierId) params = params.set('cashierId', options.cashierId);
    if (options?.startDate) params = params.set('startDate', options.startDate);
    if (options?.endDate) params = params.set('endDate', options.endDate);
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

  /** DELETE /sales/:saleId – permanently removes an entire sale record. */
  deleteSale(saleId: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/sales/${saleId}`);
  }

  /** POST /sales/:saleId/void – voids an entire sale on the backend. */
  voidSale(saleId: string): Observable<SaleItem> {
    return this.http.post<SaleItem>(`${this.url}/sales/${saleId}/void`, {});
  }

  /** PATCH /sales/:saleId/confirm – confirms an entire sale with a payment method. */
  confirmSale(
    saleId: string,
    paymentMethod: PaymentMethod,
    splitAmounts?: { cashAmount: number; mpesaAmount: number },
    mpesaTransactionId?: string,
  ): Observable<SaleItem> {
    return this.http.patch<SaleItem>(`${this.url}/sales/${saleId}/confirm`, {
      paymentMethod,
      confirmed: true,
      mpesaTransactionId,
      ...(splitAmounts ?? {}),
    });
  }

  getAllMpesaMessages(): Observable<MpesaMessage[]> {
    return this.http.get<MpesaMessage[]>(`${this.url}/payments/shift-payments`);
  }

  /** PATCH /sales/:saleId/unconfirm – reverts a confirmed sale to pending. */
  unconfirmSale(saleId: string): Observable<SaleItem> {
    return this.http.patch<SaleItem>(`${this.url}/sales/${saleId}/unconfirm`, {
      paymentMethod: null,
      confirmed: false,
    });
  }
}
