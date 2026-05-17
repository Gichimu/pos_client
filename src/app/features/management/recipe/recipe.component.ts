import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Recipe } from '../../../core/models/recipe.model';
import { recipeStore } from '../../../store/recipes/recipe.store';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { RbacAllow } from '../../../core/directives/rbac-allow';
import {
  RecipeFormModalComponent,
  RecipeFormData,
} from './recipe-form-modal/recipe-form-modal.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-recipe',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
    RbacAllow,
  ],
  templateUrl: './recipe.component.html',
  styleUrl: './recipe.component.scss',
})
export class RecipeComponent implements OnInit {
  private readonly store = inject(recipeStore);
  private readonly dialog = inject(MatDialog);
  private readonly sweetAlert = inject(SweetAlertService);

  ngOnInit(): void {
    this.store.loadRecipes();
  }

  readonly recipes = this.store.recipes;
  readonly loading = this.store.loading;

  readonly displayedColumns = ['menuItem', 'ingredients', 'notes', 'actions'];

  readonly searchQuery = signal('');
  readonly pageIndex = signal(0);
  readonly PAGE_SIZE = 10;

  readonly filteredRecipes = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.recipes();
    return this.recipes().filter(
      (r) =>
        r.menuItemName.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.ingredientName.toLowerCase().includes(q)),
    );
  });

  readonly pagedRecipes = computed(() => {
    const start = this.pageIndex() * this.PAGE_SIZE;
    return this.filteredRecipes().slice(start, start + this.PAGE_SIZE);
  });

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  /** Returns a short ingredient summary string for the table cell. */
  ingredientSummary(recipe: Recipe): string {
    const items = recipe.ingredients;
    if (items.length === 0) return '—';
    const preview = items
      .slice(0, 2)
      .map((i) => `${i.quantity} ${i.unit} ${i.ingredientName}`)
      .join(', ');
    return items.length > 2 ? `${preview} +${items.length - 2} more` : preview;
  }

  openCreateDialog(): void {
    const ref = this.dialog.open<RecipeFormModalComponent, RecipeFormData, Recipe>(
      RecipeFormModalComponent,
      { data: {}, maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe((recipe) => {
      if (recipe) {
        this.store.addRecipe(recipe).subscribe({
          next: () => this.sweetAlert.success(`Recipe for "${recipe.menuItemName}" created`),
          error: (err: any) =>
            this.sweetAlert.error(`Failed to create recipe: ${err?.message ?? 'Unknown error'}`),
        });
      }
    });
  }

  openEditDialog(recipe: Recipe): void {
    const ref = this.dialog.open<RecipeFormModalComponent, RecipeFormData, Recipe>(
      RecipeFormModalComponent,
      { data: { recipe }, maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        this.store.updateRecipe(updated);
        this.sweetAlert.success(`Recipe for "${updated.menuItemName}" updated`);
      }
    });
  }

  confirmDelete(recipe: Recipe): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete Recipe',
          message: `Are you sure you want to delete the recipe for "${recipe.menuItemName}"? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        },
        width: '380px',
      },
    );
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.deleteRecipe(recipe._id!);
        this.sweetAlert.success(`Recipe for "${recipe.menuItemName}" deleted`);
      }
    });
  }
}
