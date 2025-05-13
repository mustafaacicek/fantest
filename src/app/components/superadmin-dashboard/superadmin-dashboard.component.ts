import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Router } from '@angular/router';
import { CountryComponent } from './country/country.component';
import { TeamComponent } from './team/team.component';
import { AdminUserComponent } from './admin-user/admin-user.component';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, CountryComponent, TeamComponent, AdminUserComponent],
  templateUrl: './superadmin-dashboard.component.html',
  styleUrls: ['./superadmin-dashboard.component.scss']
})
export class SuperadminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  activeSection: string = 'dashboard';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      // Redirect if not logged in or not a superadmin
      if (!user || user.role !== 'SUPERADMIN') {
        this.router.navigate(['/login']);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
  
  setActiveSection(section: string): void {
    this.activeSection = section;
  }
}
