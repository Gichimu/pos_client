export type StockReorderStatus = 'good' | 'low' | 'critical';
export type ReorderLevel = 3 | 5 | 10 | 20;
export type ProductType = 'menu' | 'menu-stock' | 'raw-stock';
/** Unit of measurement for raw-stock quantities. */
export type StockUnit =
  | 'L'
  | 'mL'
  | 'cL'
  | 'fl oz' // Volume
  | 'kg'
  | 'g'
  | 'mg'
  | 'lb'
  | 'oz' // Weight
  | 'pcs'
  | 'dozen'
  | 'pack'
  | 'bag'
  | 'box' // Count
  | 'portion'
  | 'tray'; // Other
export type ProductCategory = 'breakfast' | 'drinks' | 'food' | 'others';
export type RawStockCategory =
  | 'grains'
  | 'dairy'
  | 'sweeteners'
  | 'oils'
  | 'vegetables'
  | 'spices'
  | 'others';
export type breakfastSubCategory = 'snacks' | 'pastries' | 'sandwiches';
export type drinkSubCategory = 'hot' | 'cold' | 'alcoholic';
export type foodSubCategory =
  | 'accompaniments'
  | 'meals'
  | 'beef'
  | 'chicken'
  | 'pork'
  | 'seafood'
  | 'Matumbo';
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
  category: string;
  subCategory: string;
  /** Distinguishes sellable menu items from raw kitchen ingredients. */
  productType?: ProductType;
  /** Unit of measurement — relevant for raw-stock items. */
  unit?: StockUnit;
  /** Indicates if the product is active or discontinued. */
  inUse?: boolean;
  hasRecipe?: boolean;
}
