import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthService } from '../../../../core/services/auth.service';
import { RefundApprovalDialogComponent } from './refund-approval-dialog.component';
import { RefundApprovalDialogData } from './refund-approval.models';

const dialogData: RefundApprovalDialogData = {
  saleId: 'sale-1',
  requiredAmount: 90,
  selectedTotal: 100,
  refundAmount: 10,
  expectedAmountLabel: 'Sale total',
  approverDisplayName: 'Sam Cashier',
};

describe('RefundApprovalDialogComponent', () => {
  const dialogRef = { close: vi.fn(), disableClose: false };
  const authService = { reauthenticate: vi.fn() };

  beforeEach(async () => {
    dialogRef.close.mockReset();
    dialogRef.disableClose = false;
    authService.reauthenticate.mockReset();

    await TestBed.configureTestingModule({
      imports: [RefundApprovalDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  it('shows the signed-in approver and refund calculation', () => {
    const fixture = TestBed.createComponent(RefundApprovalDialogComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Approving as Sam Cashier');
    expect(fixture.nativeElement.textContent).toContain('Ksh.10.00');
    expect(fixture.nativeElement.textContent).toContain('Refund to return');
    expect(fixture.nativeElement.querySelector('input[autocomplete="current-password"]')).toBeTruthy();
    fixture.destroy();
  });

  it('does not submit an empty password', () => {
    const fixture = TestBed.createComponent(RefundApprovalDialogComponent);
    fixture.componentInstance.approve();

    expect(authService.reauthenticate).not.toHaveBeenCalled();
    expect(fixture.componentInstance.passwordControl.touched).toBe(true);
  });

  it('returns the refund only after server verification supplies a token', () => {
    authService.reauthenticate.mockReturnValue(
      of({ verified: true, approvalToken: 'short-lived-token' }),
    );
    const fixture = TestBed.createComponent(RefundApprovalDialogComponent);
    fixture.componentInstance.passwordControl.setValue('correct-password');

    fixture.componentInstance.approve();

    expect(authService.reauthenticate).toHaveBeenCalledWith({
      password: 'correct-password',
      purpose: 'mpesa-overpayment-refund',
      saleId: 'sale-1',
      refundAmount: 10,
    });
    expect(dialogRef.close).toHaveBeenCalledWith({
      amount: 10,
      approvalToken: 'short-lived-token',
    });
    expect(fixture.componentInstance.passwordControl.value).toBe('');
    fixture.destroy();
  });

  it('keeps the dialog open and clears the password when verification fails', () => {
    authService.reauthenticate.mockReturnValue(of({ verified: false }));
    const fixture = TestBed.createComponent(RefundApprovalDialogComponent);
    fixture.componentInstance.passwordControl.setValue('wrong-password');

    fixture.componentInstance.approve();

    expect(fixture.componentInstance.status()).toBe('invalid-password');
    expect(fixture.componentInstance.passwordControl.value).toBe('');
    expect(dialogRef.close).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('shows a recoverable error when the reauthentication service fails', () => {
    authService.reauthenticate.mockReturnValue(throwError(() => ({ status: 500 })));
    const fixture = TestBed.createComponent(RefundApprovalDialogComponent);
    fixture.componentInstance.passwordControl.setValue('password');

    fixture.componentInstance.approve();

    expect(fixture.componentInstance.status()).toBe('request-error');
    expect(fixture.componentInstance.passwordControl.value).toBe('');
    expect(dialogRef.close).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
