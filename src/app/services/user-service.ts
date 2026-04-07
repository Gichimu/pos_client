import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../core/models/user.model';
import { MOCK_USERS } from '../core/constants/roles.constants';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly url = environment.apiUrl;
  private readonly http = inject(HttpClient);

  /** GET /users – returns all users. */
  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.url}/users`);
  }

  /** POST /users – adds a new user. */
  addUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.url}/users`, user);
  }

  /** PUT /users/:id – updates an existing user. */
  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.url}/users/${user._id}`, user);
  }

  /** DELETE /users/:id – removes a user by id. */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/users/${id}`);
  }
}
