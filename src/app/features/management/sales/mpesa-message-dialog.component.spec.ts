import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MpesaMessage } from '../../../core/models/mpesa-message.model';
import { SalesService } from '../../../core/services/sales-service';
import { authStore } from '../../../store/auth/auth.store';
import { MpesaMessageDialogComponent } from './mpesa-message-dialog.component';

const message: MpesaMessage = {
  mpesaCode: 'QW123ABC',
  customerName: 'Alex Customer',
  amount: 100,
  Date: new Date('2026-09-24T09:00:00Z'),
  isUsed: false,
  transactionDate: '2026-09-24',
  timestamp: '09:00',
};

describe('MpesaMessageDialogComponent refund entry point', () => {
  const pickerData = {
    requiredAmount: 90,
    saleId: 'sale-1',
    allowOverpaymentRefund: true,
    expectedAmountLabel: 'Sale total' as const,
  };
  const pickerRef = { close: vi.fn() };
  const auth = {
    user: () => ({ firstName: 'Sam', lastName: 'Cashier', email: 'sam@example.test' }),
  };
  let refundResult: { amount: number; approvalToken: string } | undefined;
  const nestedDialogRef = { afterClosed: () => of(refundResult) };
  const salesService = { getAllMpesaMessages: vi.fn(() => of([message])) };

  afterEach(() => vi.restoreAllMocks());

  beforeEach(async () => {
    pickerRef.close.mockReset();
    refundResult = undefined;
    salesService.getAllMpesaMessages.mockReturnValue(of([message]));

    await TestBed.configureTestingModule({
      imports: [MpesaMessageDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: pickerData },
        { provide: MatDialogRef, useValue: pickerRef },
        { provide: authStore, useValue: auth },
        { provide: SalesService, useValue: salesService },
      ],
    }).compileComponents();
  });

  it('shows refund action only for enabled overpayment and computes the difference', () => {
    const fixture = TestBed.createComponent(MpesaMessageDialogComponent);
    const component = fixture.componentInstance;
    component.selectedMessages.set([message]);
    fixture.detectChanges();

    expect(component.overpaymentAmount()).toBe(10);
    expect(component.isOverpaid()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Request refund');
    fixture.destroy();
  });

  it('preserves the selected message when refund approval is cancelled', () => {
    const openDialog = vi.spyOn(MatDialog.prototype, 'open').mockReturnValue(nestedDialogRef as any);
    const fixture = TestBed.createComponent(MpesaMessageDialogComponent);
    const component = fixture.componentInstance;
    component.selectedMessages.set([message]);
    expect(component.isOverpaid()).toBe(true);

    component.requestRefund();

    expect(component.refundActionError()).toBe('');
    expect(openDialog).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: expect.objectContaining({
          saleId: 'sale-1',
          requiredAmount: 90,
          selectedTotal: 100,
          refundAmount: 10,
          approverDisplayName: 'Sam Cashier',
        }),
      }),
    );
    expect(component.selectedMessages()).toEqual([message]);
    expect(pickerRef.close).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('returns the selected M-Pesa message with an approved refund', () => {
    refundResult = { amount: 10, approvalToken: 'one-use-token' };
    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue(nestedDialogRef as any);
    const fixture = TestBed.createComponent(MpesaMessageDialogComponent);
    const component = fixture.componentInstance;
    component.selectedMessages.set([message]);

    component.requestRefund();

    expect(pickerRef.close).toHaveBeenCalledWith({
      messages: [message],
      refund: refundResult,
    });
    fixture.destroy();
  });

  it('does not enable refund for an equal total or a bulk picker', () => {
    const fixture = TestBed.createComponent(MpesaMessageDialogComponent);
    const component = fixture.componentInstance;
    component.selectedMessages.set([{ ...message, amount: 90 }]);
    expect(component.isOverpaid()).toBe(false);
    expect(component.isValidSelection()).toBe(true);

    component.selectedMessages.set([message]);
    Object.assign(component.data, { allowOverpaymentRefund: false });
    expect(component.isOverpaid()).toBe(false);
    expect(component.isValidSelection()).toBe(false);
    fixture.destroy();
  });
});
