import { StockUnit } from './product.model';

/**
 * A single raw-stock ingredient used in a recipe.
 * `ingredientId` references a Product document with productType === 'raw-stock'.
 * `unit` is always derived from the raw-stock product's own `unit` field and
 * persisted here so the recipe is self-contained for display and cost calculation.
 */
export interface RecipeIngredient {
  ingredientId: string;   // Product._id  (productType === 'raw-stock')
  ingredientName: string; // Denormalised for display
  quantity: number;
  unit: StockUnit;        // Persisted from the raw-stock product's unit field
}

/**
 * A recipe links one menu item to the raw ingredients consumed to make it.
 * `menuItemId` references a Product document with productType === 'menu' (or unset).
 *
 * Collection note: both menuItems and rawStock live in the same `products`
 * collection, distinguished by the `productType` field.  Recipes are stored
 * in a separate `recipes` collection and reference Product._id values.
 */
export interface Recipe {
  _id?: string;
  menuItemId: string;        // Product._id  (productType === 'menu')
  menuItemName: string;      // Denormalised for display
  ingredients: RecipeIngredient[];
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
