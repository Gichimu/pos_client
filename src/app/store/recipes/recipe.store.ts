import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { RecipeService } from '../../core/services/recipe-service';
import { Recipe } from '../../core/models/recipe.model';

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
}

const initialState: RecipeState = {
  recipes: [],
  loading: false,
  error: null,
};

export const recipeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(RecipeService)) => ({
    loadRecipes(): void {
      patchState(store, { loading: true });
      service.getAll().subscribe({
        next: (recipes) => patchState(store, { recipes, loading: false }),
        error: (err) => patchState(store, { error: err.message, loading: false }),
      });
    },

    addRecipe(recipe: Recipe): Observable<Recipe> {
      return service.create(recipe).pipe(
        tap((created) => patchState(store, { recipes: [...store.recipes(), created] })),
        catchError((err) => {
          patchState(store, { error: err.message });
          return throwError(() => err);
        }),
      );
    },

    updateRecipe(recipe: Recipe): void {
      service.update(recipe).subscribe({
        next: (updated) =>
          patchState(store, {
            recipes: store.recipes().map((r) => (r._id === updated._id ? updated : r)),
          }),
        error: (err) => patchState(store, { error: err.message }),
      });
    },

    deleteRecipe(id: string): void {
      service.delete(id).subscribe({
        next: () =>
          patchState(store, { recipes: store.recipes().filter((r) => r._id !== id) }),
        error: (err) => patchState(store, { error: err.message }),
      });
    },
  })),
  withHooks({
    onInit(store) {
      store.loadRecipes();
    },
  }),
);
