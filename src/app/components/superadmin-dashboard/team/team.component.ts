import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Team } from '../../../models/team.model';
import { Country } from '../../../models/country.model';
import { TeamService } from '../../../services/team.service';
import { CountryService } from '../../../services/country.service';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit {
  teams: Team[] = [];
  countries: Country[] = [];
  teamForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  editMode = false;
  currentTeamId: number | null = null;
  logoPreview: string | null = null;

  constructor(
    private teamService: TeamService,
    private countryService: CountryService,
    private fb: FormBuilder
  ) {
    this.teamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      logo: ['', Validators.required],
      description: ['', Validators.required],
      countryId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadTeams();
    this.loadCountries();
  }

  loadTeams(): void {
    this.isLoading = true;
    this.teamService.getAllTeams().subscribe({
      next: (data) => {
        this.teams = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load teams. Please try again.';
        this.isLoading = false;
        console.error('Error loading teams:', error);
      }
    });
  }

  loadCountries(): void {
    this.countryService.getAllCountries().subscribe({
      next: (data) => {
        this.countries = data;
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.teamForm.invalid) {
      this.teamForm.markAllAsTouched();
      return;
    }

    const teamData: Team = this.teamForm.value;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.editMode && this.currentTeamId) {
      // Update existing team
      this.teamService.updateTeam(this.currentTeamId, teamData).subscribe({
        next: () => {
          this.successMessage = 'Team updated successfully!';
          this.loadTeams();
          this.resetForm();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to update team. Please try again.';
          this.isSubmitting = false;
          console.error('Error updating team:', error);
        }
      });
    } else {
      // Create new team
      this.teamService.createTeam(teamData).subscribe({
        next: () => {
          this.successMessage = 'Team created successfully!';
          this.loadTeams();
          this.resetForm();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to create team. Please try again.';
          this.isSubmitting = false;
          console.error('Error creating team:', error);
        }
      });
    }
  }

  editTeam(team: Team): void {
    this.editMode = true;
    this.currentTeamId = team.id || null;
    this.teamForm.patchValue({
      name: team.name,
      logo: team.logo,
      description: team.description,
      countryId: team.countryId
    });
    this.logoPreview = team.logo;
    this.scrollToForm();
  }

  deleteTeam(id: number | undefined): void {
    if (!id) {
      this.errorMessage = 'Invalid team ID';
      return;
    }
    
    if (confirm('Are you sure you want to delete this team?')) {
      this.teamService.deleteTeam(id).subscribe({
        next: () => {
          this.successMessage = 'Team deleted successfully!';
          this.loadTeams();
        },
        error: (error) => {
          this.errorMessage = 'Failed to delete team. Please try again.';
          console.error('Error deleting team:', error);
        }
      });
    }
  }

  resetForm(): void {
    this.teamForm.reset();
    this.editMode = false;
    this.currentTeamId = null;
    this.logoPreview = null;
  }

  onLogoChange(): void {
    const logoUrl = this.teamForm.get('logo')?.value;
    if (logoUrl) {
      this.logoPreview = logoUrl;
    } else {
      this.logoPreview = null;
    }
  }

  getCountryName(countryId: number): string {
    const country = this.countries.find(c => c.id === countryId);
    return country ? country.name : 'Unknown';
  }

  scrollToForm(): void {
    setTimeout(() => {
      const formElement = document.getElementById('teamForm');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}
