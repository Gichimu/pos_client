export interface RefundConfirmation {
  amount: number;
  approvalToken: string;
}

export interface ReauthenticationRequest {
  password: string;
  email: string;
  purpose: 'mpesa-overpayment-refund';
  saleId: string;
  refundAmount: number;
}

export interface ReauthenticationResult {
  verified: boolean;
  approvalToken?: string;
}
