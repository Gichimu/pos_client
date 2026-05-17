import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Recipe } from '../models/recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly url = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getAll(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(`${this.url}/recipes`);
  }

  create(recipe: Recipe): Observable<Recipe> {
    return this.http.post<Recipe>(`${this.url}/recipes`, recipe);
  }

  update(recipe: Recipe): Observable<Recipe> {
    return this.http.put<Recipe>(`${this.url}/recipes/${recipe._id}`, recipe);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.url}/recipes/${id}`);
  }
}
