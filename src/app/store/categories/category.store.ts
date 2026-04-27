import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { CategoryService } from '../../core/services/category-service';
import { inject } from '@angular/core';
import { Category } from '../../core/models/category.model';

const INITIAL_CATEGORIES = ['Beverages', 'Food', 'Pastries', 'Snacks', 'Desserts', 'Other'];

type CategoryState = { categories: Category[] };

const initialState = { categories: [] };

export const CategoryStore = signalStore(
  { providedIn: 'root' },
  withState<CategoryState>(initialState),
  withMethods((store, categoryService = inject(CategoryService)) => ({
    addCategory(name: string) {
      const trimmed = name.trim();
      if (
        !trimmed ||
        store.categories().some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
      )
        return;
      categoryService.addCategory({ name: trimmed }).subscribe({
        next: (newCategory: any) => {
          console.log('added category', newCategory);
          patchState(store, { categories: [...store.categories(), newCategory] });
        },
        error: (error) => {
          // Handle error as needed, e.g., patchState to set an error message
          console.error('Failed to add category', error);
        },
      });
    },

    removeCategory(category: Category) {
      categoryService.deleteCategory(category._id!).subscribe({
        next: () => {
          console.log('deleted category', category.name);
          patchState(store, {
            categories: store.categories().filter((c) => c.name !== category.name),
          });
        },
        error: (error) => {
          // Handle error as needed
          console.error('Failed to delete category', error);
        },
      });
    },
    renameCategory(oldName: string, newName: string) {
      const trimmed = newName.trim();
      console.log('renaming category', { oldName, newName: trimmed });
      const category = store.categories().find((c) => c.name === oldName);
      category!.name = trimmed;
      category &&
        categoryService.updateCategory(category).subscribe({
          next: (updatedCategory: any) => {
            console.log('updated category', updatedCategory);
            patchState(store, {
              categories: store
                .categories()
                .map((c) => (c.name === oldName ? { ...c, name: trimmed } : c)),
            });
          },
          error: (error) => {
            // Handle error as needed
            console.error('Failed to update category', error);
          },
        });
    },
    loadCategories() {
      categoryService.getAll().subscribe({
        next: (categories: any) => {
          console.log('loaded categories', categories);
          patchState(store, { categories: categories });
        },
        error: (error) => {
          console.error('Failed to load categories', error);
        },
      });
    },
  })),
  withHooks({
    onInit(store, categoryService = inject(CategoryService)) {
      categoryService.getAll().subscribe({
        next: (categories: any) => {
          console.log('loaded categories', categories);
          patchState(store, { categories: categories });
        },
        error: (error) => {
          console.error('Failed to load categories', error);
        },
      });
    },
  }),
);
