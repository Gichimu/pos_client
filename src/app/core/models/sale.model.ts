export type SaleConfirmStatus = 'pending' | 'confirmed';

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
  transactionDate?: Date;
}

export interface SaleItem {
  _id?: string;
  items: LineItem[];
  totalAmount: number;
}
