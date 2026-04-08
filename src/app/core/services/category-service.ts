import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly url = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getAll() {
    return this.http.get(`${this.url}/categories`);
  }

  addCategory(category: Category) {
    return this.http.post(`${this.url}/categories`, category);
  }

  updateCategory(category: Category) {
    return this.http.put(`${this.url}/categories/${category._id}`, category);
  }

  deleteCategory(id: string) {
    return this.http.delete(`${this.url}/categories/${id}`);
  }
}
