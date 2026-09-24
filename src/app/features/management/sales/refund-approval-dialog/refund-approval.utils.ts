export function currencyCents(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100);
}

export function overpaymentAmount(selectedTotal: number, requiredAmount: number): number {
  return Math.max(0, currencyCents(selectedTotal) - currencyCents(requiredAmount)) / 100;
}

export function isExactPaymentAmount(selectedTotal: number, requiredAmount: number): boolean {
  return currencyCents(selectedTotal) === currencyCents(requiredAmount);
}
