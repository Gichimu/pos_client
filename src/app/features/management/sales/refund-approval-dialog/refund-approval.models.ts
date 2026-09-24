import { MpesaMessage } from '../../../../core/models/mpesa-message.model';
import { RefundConfirmation } from '../../../../core/models/refund.model';

export type { RefundConfirmation } from '../../../../core/models/refund.model';

export type RefundExpectedAmountLabel = 'Sale total' | 'M-Pesa amount due';

export interface RefundApprovalDialogData {
  saleId: string;
  requiredAmount: number;
  selectedTotal: number;
  refundAmount: number;
  expectedAmountLabel: RefundExpectedAmountLabel;
  approverDisplayName: string;
}

export interface MpesaMessageDialogData {
  requiredAmount: number;
  saleId?: string;
  allowOverpaymentRefund?: boolean;
  expectedAmountLabel?: RefundExpectedAmountLabel;
}

export interface MpesaSelectionResult {
  messages: MpesaMessage[];
  refund?: RefundConfirmation;
}

export type RefundApprovalStatus = 'idle' | 'submitting' | 'invalid-password' | 'request-error';
