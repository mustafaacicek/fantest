import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Sound, SoundStatus } from '../../../models/sound.model';
import { SoundService } from '../../../services/sound.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sound',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sound.component.html',
  styleUrls: ['./sound.component.scss']
})
export class SoundComponent implements OnInit {
  sounds: Sound[] = [];
  soundForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  editMode = false;
  currentSoundId: number | null = null;
  soundStatuses = Object.values(SoundStatus);
  
  constructor(
    private soundService: SoundService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.soundForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      imageUrl: [''],
      soundUrl: ['', Validators.required],
      status: [SoundStatus.STOPPED]
    });
  }

  ngOnInit(): void {
    this.loadSounds();
  }

  loadSounds(): void {
    this.isLoading = true;
    this.soundService.getMyTeamSounds().subscribe({
      next: (data) => {
        this.sounds = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load sounds. Please try again.';
        this.isLoading = false;
        console.error('Error loading sounds:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.soundForm.invalid) {
      this.soundForm.markAllAsTouched();
      return;
    }

    const soundData: Sound = this.soundForm.value;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.editMode && this.currentSoundId) {
      // Update existing sound
      this.soundService.updateSound(this.currentSoundId, soundData).subscribe({
        next: () => {
          this.successMessage = 'Sound updated successfully!';
          this.loadSounds();
          this.resetForm();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to update sound. Please try again.';
          this.isSubmitting = false;
          console.error('Error updating sound:', error);
        }
      });
    } else {
      // Create new sound
      this.soundService.createSound(soundData).subscribe({
        next: () => {
          this.successMessage = 'Sound created successfully!';
          this.loadSounds();
          this.resetForm();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to create sound. Please try again.';
          this.isSubmitting = false;
          console.error('Error creating sound:', error);
        }
      });
    }
  }

  editSound(sound: Sound): void {
    this.editMode = true;
    this.currentSoundId = sound.id || null;
    
    this.soundForm.patchValue({
      title: sound.title,
      description: sound.description || '',
      imageUrl: sound.imageUrl || '',
      soundUrl: sound.soundUrl,
      status: sound.status || SoundStatus.STOPPED
    });
    
    this.scrollToForm();
  }

  deleteSound(id: number | undefined): void {
    if (!id) {
      this.errorMessage = 'Invalid sound ID';
      return;
    }
    
    if (confirm('Are you sure you want to delete this sound?')) {
      this.soundService.deleteSound(id).subscribe({
        next: () => {
          this.successMessage = 'Sound deleted successfully!';
          this.loadSounds();
        },
        error: (error) => {
          this.errorMessage = 'Failed to delete sound. Please try again.';
          console.error('Error deleting sound:', error);
        }
      });
    }
  }

  resetForm(): void {
    this.soundForm.reset({
      status: SoundStatus.STOPPED
    });
    this.editMode = false;
    this.currentSoundId = null;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case SoundStatus.PLAYING:
        return 'status-playing';
      case SoundStatus.PAUSED:
        return 'status-paused';
      default:
        return 'status-stopped';
    }
  }

  navigateToLyricsEditor(soundId: number | undefined): void {
    if (soundId) {
      this.router.navigate(['/admin/lyrics', soundId]);
    }
  }

  scrollToForm(): void {
    setTimeout(() => {
      const formElement = document.getElementById('soundForm');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}
