export type SaleConfirmStatus = 'pending' | 'confirmed';

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage: string;
  cashierId: string;
  cashierName: string;
  cashierAvatar: string;
  quantitySold: number;
  unitPrice: number;
  total: number;
  soldAt: Date;
  confirmed: boolean;
}
