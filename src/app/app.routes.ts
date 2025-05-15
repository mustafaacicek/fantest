import { Routes } from '@angular/router';
import { Role } from './models/role.enum';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/match-detail/1', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { 
    path: 'admin-dashboard', 
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AuthGuard],
    data: { role: Role.ADMIN }
  },
  { 
    path: 'admin/matches', 
    loadComponent: () => import('./components/admin-dashboard/match/match.component').then(m => m.MatchComponent),
    canActivate: [AuthGuard],
    data: { role: Role.ADMIN }
  },
  { 
    path: 'admin/match-detail/:id', 
    loadComponent: () => import('./components/admin-dashboard/match-detail/match-detail.component').then(m => m.MatchDetailComponent),
    canActivate: [AuthGuard],
    data: { role: Role.ADMIN }
  },
  { 
    path: 'admin/sounds', 
    loadComponent: () => import('./components/admin-dashboard/sound/sound.component').then(m => m.SoundComponent),
    canActivate: [AuthGuard],
    data: { role: Role.ADMIN }
  },
  { 
    path: 'admin/lyrics/:id', 
    loadComponent: () => import('./components/admin-dashboard/lyrics-editor/lyrics-editor.component').then(m => m.LyricsEditorComponent),
    canActivate: [AuthGuard],
    data: { role: Role.ADMIN }
  },
  { 
    path: 'superadmin-dashboard', 
    loadComponent: () => import('./components/superadmin-dashboard/superadmin-dashboard.component').then(m => m.SuperadminDashboardComponent),
    canActivate: [AuthGuard],
    data: { role: Role.SUPERADMIN }
  },
  { 
    path: 'superadmin/countries', 
    loadComponent: () => import('./components/superadmin-dashboard/country/country.component').then(m => m.CountryComponent),
    canActivate: [AuthGuard],
    data: { role: Role.SUPERADMIN }
  },
  { 
    path: 'superadmin/teams', 
    loadComponent: () => import('./components/superadmin-dashboard/team/team.component').then(m => m.TeamComponent),
    canActivate: [AuthGuard],
    data: { role: Role.SUPERADMIN }
  },
  { 
    path: 'superadmin/users', 
    loadComponent: () => import('./components/superadmin-dashboard/admin-user/admin-user.component').then(m => m.AdminUserComponent),
    canActivate: [AuthGuard],
    data: { role: Role.SUPERADMIN }
  },
  
  // Direct Match Detail Route
  { 
    path: 'match-detail/:id', 
    loadComponent: () => import('./components/fan/match-detail/match-detail.component').then(m => m.MatchDetailComponent) 
  },
];
