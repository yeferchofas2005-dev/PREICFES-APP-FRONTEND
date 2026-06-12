import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthResponse, LoginRequest, Usuario } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '/api/auth';
  
  // Signals to hold auth state reactively
  public currentUser = signal<Usuario | null>(null);
  public token = signal<string | null>(null);

  constructor() {
    this.loadTokenFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.handleAuthentication(response);
      }),
      catchError(error => {
        console.error('Login error', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.currentUser.set(null);
    this.token.set(null);
  }

  private handleAuthentication(response: AuthResponse): void {
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_user', JSON.stringify(response.usuario));
    
    this.currentUser.set(response.usuario);
    this.token.set(response.token);
  }

  private loadTokenFromStorage(): void {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      this.token.set(storedToken);
      try {
        this.currentUser.set(JSON.parse(storedUser));
      } catch (e) {
        this.currentUser.set(null);
      }
    }
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }
}
