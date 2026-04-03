export type StockReorderStatus = 'good' | 'pastry' | 'not-reorder' | 'pasout';

export interface Product {
  id: string;
  sku: string;
  name: string;
  imageUrl: string;
  buyingPrice: number;
  sellingPrice: number;
  currentStock: number;
  stockReorderStatus: StockReorderStatus;
  category: string;
}
