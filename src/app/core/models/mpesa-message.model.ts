export interface MpesaMessage {
  _id: string;
  transactionId: string;
  amount: number;
  sender: string;
  phone: string;
  receivedAt: Date;
  rawText: string;
  isUsed: boolean;
}
