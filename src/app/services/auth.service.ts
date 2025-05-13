import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { Role } from '../models/role.enum';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Check if user is already logged in (only in browser environment)
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(user => {
          // Store user details and tokens in local storage (only in browser)
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
          this.currentUserSubject.next(user);
          
          // Navigate based on role
          this.navigateBasedOnRole(user.role);
        })
      );
  }

  refreshToken(refreshToken: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/refresh-token`, { refreshToken })
      .pipe(
        tap(user => {
          // Update stored user (only in browser)
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
          this.currentUserSubject.next(user);
        })
      );
  }

  logout(): void {
    // Remove user from local storage (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
  
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  hasRole(role: Role): boolean {
    return this.currentUserValue?.role === role;
  }

  private navigateBasedOnRole(role: Role): void {
    switch (role) {
      case Role.ADMIN:
        this.router.navigate(['/admin-dashboard']);
        break;
      case Role.SUPERADMIN:
        this.router.navigate(['/superadmin-dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
