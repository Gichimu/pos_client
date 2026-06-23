// export interface MpesaMessage {
//   _id: string;
//   transactionId: string;
//   amount: number;
//   sender: string;
//   phone: string;
//   receivedAt: Date;
//   rawText: string;
//   isUsed: boolean;
// }

export interface MpesaMessage {
  mpesaCode: string;
  customerName: string;
  amount: number;
  Date: Date;
  isUsed: boolean;
  transactionDate: string;
  timestamp: string;
}
