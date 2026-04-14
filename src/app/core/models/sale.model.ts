export type SaleConfirmStatus = 'pending' | 'confirmed';

export type PaymentMethod = 'Cash' | 'M-Pesa' | 'PDQ';

export interface LineItem {
  _id?: string;
  productId?: string;
  productName?: string;
  productSku?: string;
  productImage?: string;
  cashierName?: string;
  cashierAvatar?: string;
  cashierId?: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  confirmed: boolean;
  paymentMethod?: PaymentMethod | null;
  transactionDate?: Date;
}

export interface SaleItem {
  _id?: string;
  shiftId?: string;
  items: LineItem[];
  totalAmount: number;
  createdAt?: Date;
}

export interface PaginatedSalesResponse {
  data: SaleItem[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}
