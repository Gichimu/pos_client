import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly url = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getAll() {
    return this.http.get(`${this.url}/products`);
  }

  addProduct(product: any) {
    return this.http.post(`${this.url}/products`, product);
  }

  updateProduct(product: any) {
    return this.http.put(`${this.url}/products/${product._id}`, product);
  }

  deleteProduct(id: string) {
    return this.http.delete(`${this.url}/products/${id}`);
  }
}
