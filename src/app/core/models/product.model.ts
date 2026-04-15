export type StockReorderStatus = 'good' | 'low' | 'critical';
export type ReorderLevel = 3 | 5 | 10 | 20;

export interface Product {
  _id?: string;
  sku: string;
  name: string;
  imageUrl: string;
  buyingPrice: number;
  sellingPrice: number;
  currentStock: number;
  stockReorderLevel: ReorderLevel;
  stockReorderStatus?: StockReorderStatus;
  category: string;
}


