import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment.development';
import { AuthService } from './auth.service';

describe('AuthService reauthentication', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('posts the password and refund context to the authenticated reauthentication endpoint', () => {
    let response: unknown;
    service
      .reauthenticate({
        password: 'secret',
        purpose: 'mpesa-overpayment-refund',
        saleId: 'sale-1',
        refundAmount: 10,
      })
      .subscribe((result) => (response = result));

    const request = httpTesting.expectOne(`${environment.apiUrl}/auth/reauthenticate`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      password: 'secret',
      purpose: 'mpesa-overpayment-refund',
      saleId: 'sale-1',
      refundAmount: 10,
    });
    request.flush({ verified: true, approvalToken: 'one-use-token' });
    expect(response).toEqual({ verified: true, approvalToken: 'one-use-token' });
  });
});
