import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { Product, ReorderLevel } from '../../../../core/models/product.model';

export interface RawStockFormData {
  product?: Product;
}

const REORDER_LEVEL_OPTIONS: { value: ReorderLevel; label: string }[] = [
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
];

/** Raw stock category → subcategory items map. */
const RAW_SUBCATEGORY_MAP: Record<string, { value: string; label: string }[]> = {
  grains: [
    { value: 'wheat_flour', label: 'Wheat Flour' },
    { value: 'maize_flour', label: 'Maize Flour' },
    { value: 'rice', label: 'Rice' },
    { value: 'oats', label: 'Oats' },
    { value: 'semolina', label: 'Semolina' },
  ],
  dairy: [
    { value: 'milk', label: 'Milk' },
    { value: 'eggs', label: 'Eggs' },
    { value: 'butter', label: 'Butter' },
    { value: 'cream', label: 'Cream' },
    { value: 'yogurt', label: 'Yogurt' },
    { value: 'cheese', label: 'Cheese' },
  ],
  sweeteners: [
    { value: 'white_sugar', label: 'White Sugar' },
    { value: 'brown_sugar', label: 'Brown Sugar' },
    { value: 'honey', label: 'Honey' },
    { value: 'syrup', label: 'Syrup' },
    { value: 'salt', label: 'Salt' },
  ],
  oils: [
    { value: 'cooking_oil', label: 'Cooking Oil' },
    { value: 'ghee', label: 'Ghee' },
    { value: 'margarine', label: 'Margarine' },
    { value: 'coconut_oil', label: 'Coconut Oil' },
  ],
  vegetables: [
    { value: 'tomatoes', label: 'Tomatoes' },
    { value: 'onions', label: 'Onions' },
    { value: 'garlic', label: 'Garlic' },
    { value: 'ginger', label: 'Ginger' },
    { value: 'potatoes', label: 'Potatoes' },
    { value: 'carrots', label: 'Carrots' },
  ],
  spices: [
    { value: 'black_pepper', label: 'Black Pepper' },
    { value: 'coriander', label: 'Coriander' },
    { value: 'cumin', label: 'Cumin' },
    { value: 'paprika', label: 'Paprika' },
    { value: 'turmeric', label: 'Turmeric' },
    { value: 'bay_leaves', label: 'Bay Leaves' },
  ],
  others: [
    { value: 'baking_powder', label: 'Baking Powder' },
    { value: 'vinegar', label: 'Vinegar' },
    { value: 'soy_sauce', label: 'Soy Sauce' },
    { value: 'stock_cubes', label: 'Stock Cubes' },
    { value: 'yeast', label: 'Yeast' },
  ],
};

export const RAW_STOCK_CATEGORIES: { value: string; label: string }[] = [
  { value: 'grains', label: 'Grains & Flour' },
  { value: 'dairy', label: 'Dairy & Eggs' },
  { value: 'sweeteners', label: 'Sweeteners & Salt' },
  { value: 'oils', label: 'Oils & Fats' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'spices', label: 'Spices & Herbs' },
  { value: 'others', label: 'Others' },
];

@Component({
  selector: 'app-raw-stock-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './raw-stock-form-modal.component.html',
  styleUrl: './raw-stock-form-modal.component.scss',
})
export class RawStockFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RawStockFormModalComponent>);
  readonly data = inject<RawStockFormData>(MAT_DIALOG_DATA);

  readonly isEdit = computed(() => !!this.data?.product);
  readonly categories = RAW_STOCK_CATEGORIES;
  readonly reorderLevelOptions = REORDER_LEVEL_OPTIONS;

  readonly form = this.fb.group({
    name: [this.data?.product?.name ?? '', [Validators.required, Validators.minLength(2)]],
    category: [this.data?.product?.category ?? '', Validators.required],
    subCategory: [this.data?.product?.subCategory ?? '', Validators.required],
    buyingPrice: [
      this.data?.product?.buyingPrice ?? null,
      [Validators.required, Validators.min(0)],
    ],
    currentStock: [
      this.data?.product?.currentStock ?? null,
      [Validators.required, Validators.min(0)],
    ],
    stockReorderLevel: [this.data?.product?.stockReorderLevel ?? 5, Validators.required],
  });

  private readonly categoryValue = toSignal(
    this.form.controls.category.valueChanges.pipe(
      startWith(this.form.controls.category.value),
    ),
    { initialValue: this.form.controls.category.value },
  );

  readonly availableSubCategories = computed(() => {
    const cat = (this.categoryValue() ?? '').toLowerCase();
    return RAW_SUBCATEGORY_MAP[cat] ?? [];
  });

  close() {
    this.dialogRef.close();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const name = v.name!.trim();
    const product: Product = {
      _id: this.data?.product?._id,
      sku: `RS-${name.replace(/\s+/g, '-').toUpperCase()}`,
      name,
      category: v.category!,
      subCategory: v.subCategory!,
      buyingPrice: Number(v.buyingPrice),
      sellingPrice: 0, // Raw stock is not sold directly
      currentStock: Number(v.currentStock),
      stockReorderLevel: v.stockReorderLevel as ReorderLevel,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(name)}/60/60`,
      productType: 'raw-stock',
    };
    this.dialogRef.close(product);
  }
}
