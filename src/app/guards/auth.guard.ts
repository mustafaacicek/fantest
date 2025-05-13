import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/role.enum';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Check if route has data with required role
    if (route.data['role']) {
      const requiredRole = route.data['role'] as Role;
      if (!this.authService.hasRole(requiredRole)) {
        // Redirect based on actual role
        const currentRole = this.authService.currentUserValue?.role;
        if (currentRole === Role.ADMIN) {
          this.router.navigate(['/admin-dashboard']);
        } else if (currentRole === Role.SUPERADMIN) {
          this.router.navigate(['/superadmin-dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
        return false;
      }
    }

    return true;
  }
}
