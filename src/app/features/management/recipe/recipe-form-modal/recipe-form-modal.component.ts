import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormArray,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Product } from '../../../../core/models/product.model';
import { Recipe, RecipeIngredient } from '../../../../core/models/recipe.model';
import { productStore } from '../../../../store/products/product.store';

export interface RecipeFormData {
  recipe?: Recipe;
}

@Component({
  selector: 'app-recipe-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './recipe-form-modal.component.html',
  styleUrl: './recipe-form-modal.component.scss',
})
export class RecipeFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RecipeFormModalComponent>);
  readonly data = inject<RecipeFormData>(MAT_DIALOG_DATA);
  private readonly pStore = inject(productStore);

  readonly isEdit = computed(() => !!this.data?.recipe);

  /** Sellable menu items — the finished dish this recipe produces. */
  readonly menuItems = computed(() =>
    this.pStore
      .products()
      .filter((p) => !p.productType || p.productType === 'menu' || p.productType === 'menu-stock'),
  );

  /** Raw-stock products — the ingredients. */
  readonly rawStockItems = computed(() =>
    this.pStore.products().filter((p) => p.productType === 'menu-stock'),
  );

  // ── Autocomplete for menu item ──────────────────────────────────────────────

  /**
   * Input control for the autocomplete.
   * Angular Material sets this to the full Product object on selection,
   * so we type it accordingly and use displayWith to render the name.
   */
  readonly menuItemSearch = new FormControl<Product | string | null>(
    this.data?.recipe?.menuItemName ?? '',
  );

  /**
   * Converts the autocomplete value (Product object or typed string) to a
   * display string. Used by mat-autocomplete [displayWith].
   */
  readonly displayMenuItem = (value: Product | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name;
  };

  /** Reactive snapshot of the search value — drives filtering. */
  private readonly menuItemSearchValue = toSignal(
    this.menuItemSearch.valueChanges.pipe(startWith(this.menuItemSearch.value ?? '')),
    { initialValue: this.menuItemSearch.value ?? ('' as Product | string | null) },
  );

  /** Menu items filtered by the current search text (handles both string and Product). */
  readonly filteredMenuItems = computed(() => {
    const raw = this.menuItemSearchValue();
    // Extract the text to filter by — may be a Product (on selection) or typed string
    const text =
      typeof raw === 'string'
        ? raw.toLowerCase().trim()
        : ((raw as Product | null)?.name?.toLowerCase().trim() ?? '');
    if (!text) return this.menuItems();
    return this.menuItems().filter((p) => p.name.toLowerCase().includes(text));
  });

  // ───────────────────────────────────────────────────────────────────────────

  readonly form = this.fb.group({
    menuItemId: [this.data?.recipe?.menuItemId ?? '', Validators.required],
    notes: [this.data?.recipe?.notes ?? ''],
    ingredients: this.fb.array((this.data?.recipe?.ingredients ?? []).map((i) => this.buildRow(i))),
  });

  get ingredientsArray(): FormArray {
    return this.form.controls['ingredients'] as FormArray;
  }

  /**
   * Reactive snapshot of the entire ingredients FormArray value.
   * Because this is a signal, Angular re-evaluates any template expression that
   * reads it whenever an ingredient control changes (e.g. ingredientId selection).
   * This is necessary for zoneless change detection (Angular 21).
   */
  readonly ingredientsValue = toSignal(
    this.ingredientsArray.valueChanges.pipe(startWith(this.ingredientsArray.value)),
    { initialValue: this.ingredientsArray.value as any[] },
  );

  private buildRow(ingredient?: Partial<RecipeIngredient>): FormGroup {
    return this.fb.group({
      ingredientId: [ingredient?.ingredientId ?? '', Validators.required],
      ingredientName: [ingredient?.ingredientName ?? ''],
      quantity: [ingredient?.quantity ?? null, [Validators.required, Validators.min(0.01)]],
      unit: [ingredient?.unit ?? ''],
    });
  }

  addIngredient(): void {
    this.ingredientsArray.push(this.buildRow());
  }

  removeIngredient(index: number): void {
    this.ingredientsArray.removeAt(index);
  }

  /**
   * Returns the ingredientId currently selected for a given row index.
   * Reads from the reactive `ingredientsValue` signal so Angular re-evaluates
   * this on every FormArray value change (required for zoneless change detection).
   */
  getRowIngredientId(index: number): string {
    return this.ingredientsValue()?.[index]?.ingredientId ?? '';
  }

  /**
   * Returns the unit of the selected raw-stock product.
   * Used in the template badge and in save() — always derives from live store data.
   */
  getIngredientUnit(ingredientId: string): string {
    return this.rawStockItems().find((p) => p._id === ingredientId)?.unit ?? '';
  }

  /** Called when the user picks a suggestion from the autocomplete panel. */
  onMenuItemSelected(product: Product): void {
    // Store the ID in the form group; displayWith handles the display text.
    this.form.controls['menuItemId'].setValue(product._id ?? '');
  }

  /** Called on every keystroke in the search input — clears the stored ID until a valid option is selected. */
  onMenuItemSearchInput(): void {
    this.form.controls['menuItemId'].setValue('');
  }

  /** Auto-fill ingredient name (and keep unit form control in sync) when a raw stock item is selected. */
  onIngredientSelect(index: number, ingredientId: string): void {
    const product = this.rawStockItems().find((p) => p._id === ingredientId);
    if (product) {
      this.ingredientsArray.at(index).patchValue({
        ingredientName: product.name,
        unit: product.unit ?? 'pcs',
      });
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const menuItem = this.menuItems().find((p) => p._id === v.menuItemId);

    const recipe: Recipe = {
      _id: this.data?.recipe?._id,
      menuItemId: v.menuItemId!,
      menuItemName: menuItem?.name ?? '',
      ingredients: (v.ingredients as any[]).map((i) => ({
        ingredientId: i.ingredientId,
        ingredientName: i.ingredientName,
        quantity: Number(i.quantity),
        // Always derive unit from the live raw-stock product (source of truth)
        unit: (this.getIngredientUnit(i.ingredientId) ||
          i.unit ||
          'pcs') as RecipeIngredient['unit'],
      })) as RecipeIngredient[],
      notes: v.notes ?? '',
    };

    this.dialogRef.close(recipe);
  }
}
