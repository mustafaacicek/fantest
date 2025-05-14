import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, filter, take, map, catchError, throwError } from 'rxjs';
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

  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<any>(null);
  
  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Check if user is already logged in (only in browser environment)
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          this.currentUserSubject.next(user);
          
          // Check if token is about to expire and refresh if needed
          this.checkTokenExpiration(user);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('currentUser');
        }
      }
    }
  }
  
  private checkTokenExpiration(user: User): void {
    if (!user || !user.accessToken) return;
    
    try {
      // Simple check to see if we need to refresh the token
      // This assumes the token is a JWT with expiration
      const tokenParts = user.accessToken.split('.');
      if (tokenParts.length === 3) {
        const tokenPayload = JSON.parse(atob(tokenParts[1]));
        const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
        const currentTime = new Date().getTime();
        
        // If token expires in less than 5 minutes, refresh it
        if (expirationTime - currentTime < 5 * 60 * 1000) {
          if (user.refreshToken) {
            this.refreshToken(user.refreshToken).subscribe();
          }
        }
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
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
    // If a refresh is already in progress, return the subject
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.pipe(
        filter(result => result !== null),
        take(1),
        map(() => this.currentUserValue as User)
      );
    }

    this.refreshTokenInProgress = true;
    this.refreshTokenSubject.next(null);

    return this.http.post<User>(`${this.apiUrl}/refresh-token`, { refreshToken })
      .pipe(
        tap(user => {
          // Update stored user (only in browser)
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
          this.currentUserSubject.next(user);
          this.refreshTokenSubject.next(user);
          this.refreshTokenInProgress = false;
        }),
        catchError(error => {
          this.refreshTokenInProgress = false;
          this.refreshTokenSubject.next(null);
          this.logout();
          return throwError(() => error);
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
