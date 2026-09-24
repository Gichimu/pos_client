import { describe, expect, it } from 'vitest';
import { isExactPaymentAmount, overpaymentAmount } from './refund-approval.utils';

describe('refund amount helpers', () => {
  it('returns only the positive overpayment, rounded to cents', () => {
    expect(overpaymentAmount(100, 90)).toBe(10);
    expect(overpaymentAmount(90.005, 90)).toBe(0.01);
    expect(overpaymentAmount(90, 100)).toBe(0);
  });

  it('compares exact amounts at currency-cent precision', () => {
    expect(isExactPaymentAmount(90, 90)).toBe(true);
    expect(isExactPaymentAmount(90.001, 90)).toBe(true);
    expect(isExactPaymentAmount(89.99, 90)).toBe(false);
    expect(isExactPaymentAmount(100, 90)).toBe(false);
  });
});
