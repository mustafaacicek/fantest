import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminUser } from '../../../models/admin-user.model';
import { Team } from '../../../models/team.model';
import { AdminUserService } from '../../../services/admin-user.service';
import { TeamService } from '../../../services/team.service';

@Component({
  selector: 'app-admin-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-user.component.html',
  styleUrls: ['./admin-user.component.scss']
})
export class AdminUserComponent implements OnInit {
  admins: AdminUser[] = [];
  teams: Team[] = [];
  adminForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  editMode = false;
  currentAdminId: number | null = null;
  showPassword = false;

  constructor(
    private adminUserService: AdminUserService,
    private teamService: TeamService,
    private fb: FormBuilder
  ) {
    this.adminForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      teamId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAdmins();
    this.loadTeams();
  }

  loadAdmins(): void {
    this.isLoading = true;
    this.adminUserService.getAllAdmins().subscribe({
      next: (data) => {
        this.admins = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load admin users. Please try again.';
        this.isLoading = false;
        console.error('Error loading admin users:', error);
      }
    });
  }

  loadTeams(): void {
    this.teamService.getAllTeams().subscribe({
      next: (data) => {
        this.teams = data;
      },
      error: (error) => {
        console.error('Error loading teams:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    const adminData: AdminUser = this.adminForm.value;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.editMode && this.currentAdminId) {
      // If password is empty in edit mode, remove it from the request
      if (!adminData.password) {
        delete adminData.password;
      }
      
      // Update existing admin
      this.adminUserService.updateAdmin(this.currentAdminId, adminData).subscribe({
        next: () => {
          this.successMessage = 'Admin user updated successfully!';
          this.loadAdmins();
          this.resetForm();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to update admin user. Please try again.';
          this.isSubmitting = false;
          console.error('Error updating admin user:', error);
        }
      });
    } else {
      // Create new admin
      this.adminUserService.createAdmin(adminData).subscribe({
        next: () => {
          this.successMessage = 'Admin user created successfully!';
          this.loadAdmins();
          this.resetForm();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to create admin user. Please try again.';
          this.isSubmitting = false;
          console.error('Error creating admin user:', error);
        }
      });
    }
  }

  editAdmin(admin: AdminUser): void {
    this.editMode = true;
    this.currentAdminId = admin.id || null;
    
    // Patch the form with admin data but exclude password
    this.adminForm.patchValue({
      username: admin.username,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      teamId: admin.teamId
    });
    
    // Make password optional in edit mode
    const passwordControl = this.adminForm.get('password');
    if (passwordControl) {
      if (this.editMode) {
        passwordControl.clearValidators();
        passwordControl.setValidators([Validators.minLength(8)]);
      } else {
        passwordControl.setValidators([Validators.required, Validators.minLength(8)]);
      }
      passwordControl.updateValueAndValidity();
    }
    
    this.scrollToForm();
  }

  deleteAdmin(id: number | undefined): void {
    if (!id) {
      this.errorMessage = 'Invalid admin user ID';
      return;
    }
    
    if (confirm('Are you sure you want to delete this admin user?')) {
      this.adminUserService.deleteAdmin(id).subscribe({
        next: () => {
          this.successMessage = 'Admin user deleted successfully!';
          this.loadAdmins();
        },
        error: (error) => {
          this.errorMessage = 'Failed to delete admin user. Please try again.';
          console.error('Error deleting admin user:', error);
        }
      });
    }
  }

  resetForm(): void {
    this.adminForm.reset();
    this.editMode = false;
    this.currentAdminId = null;
    
    // Reset password validators
    const passwordControl = this.adminForm.get('password');
    if (passwordControl) {
      passwordControl.setValidators([Validators.required, Validators.minLength(8)]);
      passwordControl.updateValueAndValidity();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getTeamName(teamId: number): string {
    const team = this.teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown';
  }

  scrollToForm(): void {
    setTimeout(() => {
      const formElement = document.getElementById('adminForm');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}
