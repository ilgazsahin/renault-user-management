import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserDto, UpdateUserDto, PaginatedUsers } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  getUsers(
    page = 1,
    limit = 10,
    search = '',
    role: 'admin' | 'user' | '' = '',
    sortBy: 'fullName' | 'username' | 'createdAt' = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Observable<PaginatedUsers> {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
      sortBy,
      sortOrder,
    };
    if (search.trim()) params['search'] = search.trim();
    if (role) params['role'] = role;
    return this.http.get<PaginatedUsers>(this.baseUrl, { params });
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  createUser(data: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.baseUrl, data);
  }

  updateUser(id: string, data: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, data);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/me/password`, {
      currentPassword,
      newPassword,
    });
  }
}
