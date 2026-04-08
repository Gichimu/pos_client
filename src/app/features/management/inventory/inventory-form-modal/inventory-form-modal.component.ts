import { Component, inject, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Product, StockReorderStatus } from '../../../../core/models/product.model';
import { CategoryStore } from '../../../../store/categories/category.store';

export interface ProductFormData {
  product?: Product;
}

const REORDER_OPTIONS: { value: StockReorderStatus; label: string }[] = [
  { value: 'good',        label: 'Good' },
  { value: 'pastry',      label: 'Pastry' },
  { value: 'not-reorder', label: 'Not Reorder' },
  { value: 'pasout',      label: 'Pasout' },
];

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
  private readonly categoryStore = inject(CategoryStore);

  readonly isEdit = computed(() => !!this.data?.product);
  readonly categories = this.categoryStore.categories;
  readonly reorderOptions = REORDER_OPTIONS;

  readonly form = this.fb.group({
    name:               [this.data?.product?.name ?? '',           [Validators.required, Validators.minLength(2)]],
    category:           [this.data?.product?.category ?? '',       Validators.required],
    buyingPrice:        [this.data?.product?.buyingPrice ?? null,  [Validators.required, Validators.min(0)]],
    sellingPrice:       [this.data?.product?.sellingPrice ?? null, [Validators.required, Validators.min(0)]],
    currentStock:       [this.data?.product?.currentStock ?? null, [Validators.required, Validators.min(0)]],
    stockReorderStatus: [this.data?.product?.stockReorderStatus ?? 'good' as StockReorderStatus, Validators.required],
    imageUrl:           [this.data?.product?.imageUrl ?? ''],
  });

  close() { this.dialogRef.close(); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const name = v.name!.trim();
    const product: Product = {
      id:                 this.data?.product?.id ?? Date.now().toString(),
      sku:                name,
      name,
      category:           v.category!,
      buyingPrice:        Number(v.buyingPrice),
      sellingPrice:       Number(v.sellingPrice),
      currentStock:       Number(v.currentStock),
      stockReorderStatus: v.stockReorderStatus as StockReorderStatus,
      imageUrl:           v.imageUrl?.trim() ||
        `https://picsum.photos/seed/${encodeURIComponent(name)}/60/60`,
    };
    this.dialogRef.close(product);
  }
}
