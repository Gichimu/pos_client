export type SaleConfirmStatus = 'pending' | 'confirmed';

export type PaymentMethod = 'Cash' | 'M-Pesa' | 'PDQ' | 'Split';

export interface LineItem {
  _id?: string;
  productId?: string;
  productName?: string;
  productSku?: string;
  productImage?: string;
  cashierName?: string;
  cashierAvatar?: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  transactionDate?: Date;
}

export interface SaleItem {
  _id?: string;
  saleId?: string;
  shiftId?: string;
  cashierId?: string;
  items: LineItem[];
  paymentMethod?: PaymentMethod | null;
  totalAmount: number;
  confirmed: boolean;
  mpesaTransactionId?: string;
  createdAt?: Date;
}

export interface PaginatedSalesResponse {
  data: SaleItem[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}
