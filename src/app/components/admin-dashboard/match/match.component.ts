import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Match, MatchStatus } from '../../../models/match.model';
import { MatchService } from '../../../services/match.service';

@Component({
  selector: 'app-match',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.scss']
})
export class MatchComponent implements OnInit {
  matches: Match[] = [];
  matchForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  editMode = false;
  currentMatchId: number | null = null;
  matchStatuses = Object.values(MatchStatus);
  
  constructor(
    private matchService: MatchService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.matchForm = this.fb.group({
      name: ['', Validators.required],
      opponentTeamId: ['', Validators.required],
      location: ['', Validators.required],
      matchDate: ['', Validators.required],
      homeScore: [0],
      awayScore: [0],
      status: [MatchStatus.PLANNED],
      activeSoundId: [null]
    });
  }

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches(): void {
    this.isLoading = true;
    this.matchService.getMyTeamMatches().subscribe({
      next: (data) => {
        this.matches = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load matches. Please try again.';
        this.isLoading = false;
        console.error('Error loading matches:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.matchForm.invalid) {
      this.matchForm.markAllAsTouched();
      return;
    }

    const matchData: Match = this.matchForm.value;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.editMode && this.currentMatchId) {
      // Update existing match
      this.matchService.updateMatch(this.currentMatchId, matchData).subscribe({
        next: () => {
          this.successMessage = 'Match updated successfully!';
          this.loadMatches();
          this.resetForm();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to update match. Please try again.';
          this.isSubmitting = false;
          console.error('Error updating match:', error);
        }
      });
    } else {
      // Create new match
      this.matchService.createMatch(matchData).subscribe({
        next: () => {
          this.successMessage = 'Match created successfully!';
          this.loadMatches();
          this.resetForm();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to create match. Please try again.';
          this.isSubmitting = false;
          console.error('Error creating match:', error);
        }
      });
    }
  }

  editMatch(match: Match): void {
    this.editMode = true;
    this.currentMatchId = match.id || null;
    
    // Format the date for the input field (yyyy-MM-ddThh:mm)
    const matchDate = new Date(match.matchDate);
    const formattedDate = matchDate.toISOString().slice(0, 16);
    
    this.matchForm.patchValue({
      name: match.name,
      opponentTeamId: match.opponentTeamId,
      location: match.location,
      matchDate: formattedDate,
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
      status: match.status || MatchStatus.PLANNED,
      activeSoundId: match.activeSoundId
    });
    
    this.scrollToForm();
  }

  deleteMatch(id: number | undefined): void {
    if (!id) {
      this.errorMessage = 'Invalid match ID';
      return;
    }
    
    if (confirm('Are you sure you want to delete this match?')) {
      this.matchService.deleteMatch(id).subscribe({
        next: () => {
          this.successMessage = 'Match deleted successfully!';
          this.loadMatches();
        },
        error: (error) => {
          this.errorMessage = 'Failed to delete match. Please try again.';
          console.error('Error deleting match:', error);
        }
      });
    }
  }

  resetForm(): void {
    this.matchForm.reset({
      homeScore: 0,
      awayScore: 0,
      status: MatchStatus.PLANNED,
      activeSoundId: null
    });
    this.editMode = false;
    this.currentMatchId = null;
  }

  formatMatchDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case MatchStatus.LIVE:
        return 'status-live';
      case MatchStatus.COMPLETED:
        return 'status-completed';
      case MatchStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return 'status-planned';
    }
  }

  scrollToForm(): void {
    setTimeout(() => {
      const formElement = document.getElementById('matchForm');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
  
  navigateToMatchDetail(matchId: number): void {
    this.router.navigate(['/admin/match-detail', matchId]);
  }
}
