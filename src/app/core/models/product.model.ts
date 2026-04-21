export type StockReorderStatus = 'good' | 'low' | 'critical';
export type ReorderLevel = 3 | 5 | 10 | 20;
export type ProductCategory = 'breakfast' | 'drinks' | 'food' | 'others';
export type breakfastSubCategory = 'snacks' | 'pastries' | 'sandwiches';
export type drinkSubCategory = 'hot' | 'cold' | 'alcoholic';
export type foodSubCategory =
  | 'accompaniments'
  | 'meals'
  | 'beef'
  | 'chicken'
  | 'pork'
  | 'seafood'
  | 'vegetarian';
export type otherSubCategory = 'sachets' | 'package' | 'supplies';

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
  category: ProductCategory;
  subCategory: string;
}
