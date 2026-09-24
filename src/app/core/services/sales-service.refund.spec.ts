import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment.development';
import { SalesService } from './sales-service';

describe('SalesService refund confirmation', () => {
  let service: SalesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SalesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends approved refund metadata with the selected M-Pesa reference', () => {
    service
      .confirmSale('sale-1', 'M-Pesa', undefined, ['QW123ABC'], {
        amount: 10,
        approvalToken: 'one-use-token',
      })
      .subscribe();

    const request = httpTesting.expectOne(`${environment.apiUrl}/sales/sale-1/confirm`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      paymentMethod: 'M-Pesa',
      confirmed: true,
      mpesaTransactionId: ['QW123ABC'],
      refund: { amount: 10, approvalToken: 'one-use-token' },
    });
    request.flush({ _id: 'sale-1', totalAmount: 90, confirmed: true, items: [] });
  });
});
