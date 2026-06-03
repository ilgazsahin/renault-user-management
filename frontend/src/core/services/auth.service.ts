import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';
import { LoginRequest, LoginResponse, TokenPayload } from '../models/auth.model';
import { environment } from '../../environments/environment';

function parseJwt(token: string): TokenPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<TokenPayload | null>(this.loadFromStorage());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService,
    private readonly router: Router,
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((res) => {
          this.tokenService.setToken(res.access_token);
          this._currentUser.set(parseJwt(res.access_token));
        }),
      );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  logout(): void {
    this.tokenService.removeToken();
    this._currentUser.set(null);
    void this.router.navigate(['/login']);
  }

  private loadFromStorage(): TokenPayload | null {
    const token = this.tokenService.getToken();
    if (!token) return null;
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return null;
    if (Date.now() >= payload.exp * 1000) {
      this.tokenService.removeToken();
      return null;
    }
    return payload;
  }
}
