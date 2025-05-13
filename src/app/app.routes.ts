import { Routes } from '@angular/router';
import { Role } from './models/role.enum';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { 
    path: 'admin-dashboard', 
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AuthGuard],
    data: { role: Role.ADMIN }
  },
  { 
    path: 'superadmin-dashboard', 
    loadComponent: () => import('./components/superadmin-dashboard/superadmin-dashboard.component').then(m => m.SuperadminDashboardComponent),
    canActivate: [AuthGuard],
    data: { role: Role.SUPERADMIN }
  },
  { path: '**', redirectTo: '/login' }
];
