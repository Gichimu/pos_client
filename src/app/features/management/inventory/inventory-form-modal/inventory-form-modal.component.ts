import { Component, inject, computed, Signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { Product, ReorderLevel, StockReorderStatus } from '../../../../core/models/product.model';
import { CategoryStore } from '../../../../store/categories/category.store';
import { Category } from '../../../../core/models/category.model';

export interface ProductFormData {
  product?: Product;
}

const REORDER_OPTIONS: { value: StockReorderStatus; label: string }[] = [
  { value: 'good', label: 'Good' },
  { value: 'low', label: 'Low' },
  { value: 'critical', label: 'Critical' },
];

const REORDER_LEVEL_OPTIONS: { value: ReorderLevel; label: string }[] = [
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
];

/** Subcategory options keyed by lowercase category name. */
const SUBCATEGORY_MAP: Record<string, { value: string; label: string }[]> = {
  breakfast: [
    { value: 'snacks', label: 'Snacks' },
    { value: 'pastries', label: 'Pastries' },
    { value: 'sandwiches', label: 'Sandwiches' },
  ],
  drinks: [
    { value: 'hot', label: 'Hot' },
    { value: 'cold', label: 'Cold' },
    { value: 'alcoholic', label: 'Alcoholic' },
  ],
  food: [
    { value: 'accompaniments', label: 'Accompaniments' },
    { value: 'meals', label: 'Meals' },
    { value: 'beef', label: 'Beef' },
    { value: 'chicken', label: 'Chicken' },
    { value: 'pork', label: 'Pork' },
    { value: 'seafood', label: 'Seafood' },
    { value: 'vegetarian', label: 'Vegetarian' },
  ],
  others: [
    { value: 'sachets', label: 'Sachets' },
    { value: 'package', label: 'Package' },
    { value: 'supplies', label: 'Supplies' },
  ],
};

/** Accepts both a raw string and a Category object (different code paths). */
function resolveCategoryName(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.toLowerCase();
  return (val?.name ?? '').toLowerCase();
}

@Component({
  selector: 'app-inventory-form-modal',
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
  templateUrl: './inventory-form-modal.component.html',
  styleUrl: './inventory-form-modal.component.scss',
})
export class InventoryFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<InventoryFormModalComponent>);
  readonly data = inject<ProductFormData>(MAT_DIALOG_DATA);
  readonly categoryStore = inject(CategoryStore);

  readonly isEdit = computed(() => !!this.data?.product);
  readonly categories = this.categoryStore.categories as Signal<Category[]>;
  readonly reorderOptions = REORDER_OPTIONS;
  readonly reorderLevelOptions = REORDER_LEVEL_OPTIONS;

  /** Units to add on top of existing stock (edit mode only). */
  readonly addToStock = new FormControl<number | null>(null, [Validators.min(0)]);

  private readonly addToStockValue = toSignal(
    this.addToStock.valueChanges.pipe(startWith(this.addToStock.value)),
    { initialValue: this.addToStock.value },
  );

  /** Live preview of new stock total. */
  readonly newStockTotal = computed(() => {
    const current = this.data?.product?.currentStock ?? 0;
    const add = Number(this.addToStockValue()) || 0;
    return current + add;
  });

  readonly form = this.fb.group({
    name: [this.data?.product?.name ?? '', [Validators.required, Validators.minLength(2)]],
    category: [this.data?.product?.category ?? '', Validators.required],
    subCategory: [this.data?.product?.subCategory ?? '', Validators.required],
    // buyingPrice: [
    //   this.data?.product?.buyingPrice ?? null,
    //   [Validators.required, Validators.min(0)],
    // ],
    sellingPrice: [
      this.data?.product?.sellingPrice ?? null,
      [Validators.required, Validators.min(0)],
    ],
    currentStock: [
      this.data?.product?.currentStock ?? null,
      [Validators.required, Validators.min(0)],
    ],
    stockReorderLevel: [this.data?.product?.stockReorderLevel ?? 5, Validators.required],
    imageUrl: [this.data?.product?.imageUrl ?? ''],
  });

  // ── Reactive subcategory options based on selected category ─────────────
  private readonly categoryValue = toSignal(
    this.form.controls.category.valueChanges.pipe(startWith(this.form.controls.category.value)),
    { initialValue: this.form.controls.category.value },
  );

  readonly availableSubCategories = computed(() => {
    const name = resolveCategoryName(this.categoryValue());
    return SUBCATEGORY_MAP[name] ?? [];
  });

  constructor() {
    // In edit mode, lock the currentStock field — users must use "Add to Stock"
    if (this.isEdit()) {
      this.form.controls.currentStock.disable();
    }

    // Reset subCategory whenever category changes, unless existing value is still valid
    effect(() => {
      const validOptions = this.availableSubCategories().map((o) => o.value);
      const current = this.form.controls.subCategory.value ?? '';
      if (!validOptions.includes(current)) {
        this.form.controls.subCategory.setValue('');
      }
    });
  }

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

    // In edit mode, currentStock = existing + addToStock delta; otherwise use form value directly
    const currentStock = this.isEdit()
      ? (this.data?.product?.currentStock ?? 0) + (Number(this.addToStock.value) || 0)
      : Number(v.currentStock);

    const product: Product = {
      _id: this.data?.product?._id,
      sku: name,
      name,
      category: v.category! as Product['category'],
      subCategory: v.subCategory!,
      buyingPrice: 0,
      sellingPrice: Number(v.sellingPrice),
      currentStock,
      stockReorderLevel: v.stockReorderLevel as ReorderLevel,
      productType: 'menu',
      imageUrl:
        v.imageUrl?.trim() || `https://picsum.photos/seed/${encodeURIComponent(name)}/60/60`,
    };
    this.dialogRef.close(product);
  }
}
