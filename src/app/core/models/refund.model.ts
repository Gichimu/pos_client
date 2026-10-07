export interface RefundConfirmation {
  amount: number;
  approvalToken: string;
}

export interface ReauthenticationRequest {
  password: string;
  /** Must match the identity on the authenticated session; server derives the actor from its token. */
  email: string;
  purpose: 'mpesa-overpayment-refund';
  saleId: string;
  refundAmount: number;
}

export interface ReauthenticationResult {
  verified: boolean;
  approvalToken?: string;
}
