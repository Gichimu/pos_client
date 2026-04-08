import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { CategoryService } from '../../core/services/category-service';
import { inject } from '@angular/core';
import { Category } from '../../core/models/category.model';

const INITIAL_CATEGORIES = ['Beverages', 'Food', 'Pastries', 'Snacks', 'Desserts', 'Other'];

type CategoryState = { categories: string[] };

const initialState = { categories: INITIAL_CATEGORIES };

export const CategoryStore = signalStore(
  { providedIn: 'root' },
  withState<CategoryState>(initialState),
  withMethods((store, categoryService = inject(CategoryService)) => ({
    addCategory(name: string) {
      const trimmed = name.trim();
      if (!trimmed || store.categories().includes(trimmed)) return;
      categoryService.addCategory({ name: trimmed }).subscribe({
        next: (newCategory: any) => {
          console.log('added category', newCategory);
          patchState(store, { categories: [...store.categories(), newCategory.name] });
        },
        error: (error) => {
          // Handle error as needed, e.g., patchState to set an error message
          console.error('Failed to add category', error);
        },
      });
    },

    removeCategory(name: string) {
      categoryService.deleteCategory(name).subscribe({
        next: () => {
          console.log('deleted category', name);
          patchState(store, { categories: store.categories().filter((c) => c !== name) });
        },
        error: (error) => {
          // Handle error as needed
          console.error('Failed to delete category', error);
        },
      });
    },
    renameCategory(oldName: string, newName: string) {
      const trimmed = newName.trim();
      categoryService.updateCategory({ name: trimmed }).subscribe({
        next: (updatedCategory: any) => {
          console.log('updated category', updatedCategory);
          patchState(store, {
            categories: store.categories().map((c) => (c === oldName ? trimmed : c)),
          });
        },
        error: (error) => {
          // Handle error as needed
          console.error('Failed to update category', error);
        },
      });
    },
  })),
  withHooks({
    onInit(store, categoryService = inject(CategoryService)) {
      categoryService.getAll().subscribe({
        next: (categories: any) => {
          patchState(store, { categories: categories.map((c: any) => c.name) });
        },
        error: (error) => {
          console.error('Failed to load categories', error);
        },
      });
    },
  }),
);
