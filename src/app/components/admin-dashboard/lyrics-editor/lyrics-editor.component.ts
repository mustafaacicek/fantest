import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SoundService } from '../../../services/sound.service';
import { LyricsService } from '../../../services/lyrics.service';
import { Sound } from '../../../models/sound.model';
import { Lyrics, LyricsItem } from '../../../models/lyrics.model';

@Component({
  selector: 'app-lyrics-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lyrics-editor.component.html',
  styleUrls: ['./lyrics-editor.component.scss']
})
export class LyricsEditorComponent implements OnInit {
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  
  sounds: Sound[] = [];
  currentSound: Sound | null = null;
  currentLyrics: Lyrics | null = null;
  lyricsForm: FormGroup;
  
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  
  currentTime = 0;
  isPlaying = false;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private soundService: SoundService,
    private lyricsService: LyricsService
  ) {
    this.lyricsForm = this.fb.group({
      soundId: [null, Validators.required],
      lyricsItems: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadSounds();
    
    // Check if soundId is provided in the route
    this.route.paramMap.subscribe(params => {
      const soundId = params.get('id');
      if (soundId) {
        this.loadSoundAndLyrics(Number(soundId));
      }
    });
  }

  get lyricsItems(): FormArray {
    return this.lyricsForm.get('lyricsItems') as FormArray;
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

  loadSoundAndLyrics(soundId: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // First, get the sound details
    this.soundService.getSoundById(soundId).subscribe({
      next: (sound) => {
        this.currentSound = sound;
        this.lyricsForm.patchValue({ soundId: sound.id });
        
        // Then, try to get lyrics for this sound
        this.lyricsService.getLyricsBySoundId(soundId).subscribe({
          next: (lyrics) => {
            this.currentLyrics = lyrics;
            this.populateLyricsForm(lyrics);
            this.isLoading = false;
          },
          error: (error) => {
            // If 404, it means no lyrics exist yet for this sound
            if (error.status === 404) {
              this.currentLyrics = null;
              this.resetLyricsForm();
            } else {
              this.errorMessage = 'Failed to load lyrics. Please try again.';
              console.error('Error loading lyrics:', error);
            }
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        this.errorMessage = 'Failed to load sound details. Please try again.';
        this.isLoading = false;
        console.error('Error loading sound:', error);
      }
    });
  }

  onSoundChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const soundId = Number(select.value);
    if (soundId) {
      this.loadSoundAndLyrics(soundId);
    } else {
      this.currentSound = null;
      this.currentLyrics = null;
      this.resetLyricsForm();
    }
  }

  populateLyricsForm(lyrics: Lyrics): void {
    this.resetLyricsForm();
    
    if (lyrics.lyricsData && lyrics.lyricsData.length > 0) {
      // Sort by second
      const sortedItems = [...lyrics.lyricsData].sort((a, b) => a.second - b.second);
      
      sortedItems.forEach(item => {
        // Handle case where lyric might be a JSON string
        let lyricText = item.lyric;
        
        // Try to parse if it looks like JSON
        if (typeof lyricText === 'string' && 
            (lyricText.startsWith('[{') || lyricText.startsWith('{"'))) {
          try {
            const parsed = JSON.parse(lyricText);
            if (Array.isArray(parsed)) {
              // If it's an array, take the first item's lyric if available
              lyricText = parsed[0]?.lyric || lyricText;
            } else if (parsed.lyric) {
              // If it's an object with a lyric property
              lyricText = parsed.lyric;
            }
          } catch (e) {
            // If parsing fails, use the original string
            console.warn('Failed to parse lyric JSON:', e);
          }
        }
        
        this.lyricsItems.push(
          this.fb.group({
            lyric: [lyricText, Validators.required],
            second: [Number(item.second), [Validators.required, Validators.min(0)]]
          })
        );
      });
    } else if (lyrics.lyricsText) {
      // If there's only lyricsText but no lyricsData, create a default entry
      this.lyricsItems.push(
        this.fb.group({
          lyric: [lyrics.lyricsText, Validators.required],
          second: [0, [Validators.required, Validators.min(0)]]
        })
      );
    }
  }

  resetLyricsForm(): void {
    while (this.lyricsItems.length) {
      this.lyricsItems.removeAt(0);
    }
  }

  addLyricsItem(second?: number): void {
    this.lyricsItems.push(
      this.fb.group({
        lyric: ['', Validators.required],
        second: [second || 0, [Validators.required, Validators.min(0)]]
      })
    );
    
    // Sort the form array by second
    this.sortLyricsItems();
  }

  removeLyricsItem(index: number): void {
    this.lyricsItems.removeAt(index);
  }

  sortLyricsItems(): void {
    // Get current values
    const items = this.lyricsItems.value as LyricsItem[];
    
    // Sort by second
    const sortedItems = [...items].sort((a, b) => a.second - b.second);
    
    // Reset form array
    this.resetLyricsForm();
    
    // Add sorted items back
    sortedItems.forEach(item => {
      this.lyricsItems.push(
        this.fb.group({
          lyric: [item.lyric, Validators.required],
          second: [item.second, [Validators.required, Validators.min(0)]]
        })
      );
    });
  }

  onSubmit(): void {
    if (this.lyricsForm.invalid) {
      this.lyricsForm.markAllAsTouched();
      return;
    }

    const soundId = this.lyricsForm.get('soundId')?.value;
    if (!soundId) {
      this.errorMessage = 'Please select a sound first';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Get the lyrics items from the form array
    const lyricsItems: LyricsItem[] = this.lyricsItems.value;
    
    // Validate that we have at least one lyrics item
    if (lyricsItems.length === 0) {
      this.errorMessage = 'Please add at least one lyrics item';
      this.isSubmitting = false;
      return;
    }
    
    // Sort by second before saving
    lyricsItems.sort((a, b) => a.second - b.second);

    // Create the payload with the exact format expected by the API
    const lyricsToSave: Lyrics = {
      soundId: soundId,
      lyricsData: lyricsItems.map(item => {
        // Ensure lyric is a simple string, not a nested JSON object
        let lyricText = item.lyric;
        
        // If somehow the lyric is an object or array, stringify it
        if (typeof lyricText !== 'string') {
          lyricText = JSON.stringify(lyricText);
        }
        
        return {
          lyric: lyricText,
          second: Number(item.second)
        };
      })
    };

    console.log('Submitting lyrics data:', lyricsToSave);

    if (this.currentLyrics?.id) {
      // Update existing lyrics
      this.lyricsService.updateLyrics(this.currentLyrics.id, lyricsToSave).subscribe({
        next: (response) => {
          this.successMessage = 'Lyrics updated successfully!';
          this.currentLyrics = response;
          // If the response has lyricsData, update our form
          if (response.lyricsData) {
            this.populateLyricsForm(response);
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to update lyrics. Please try again.';
          this.isSubmitting = false;
          console.error('Error updating lyrics:', error);
        }
      });
    } else {
      // Create new lyrics
      this.lyricsService.createLyrics(lyricsToSave).subscribe({
        next: (response) => {
          this.successMessage = 'Lyrics created successfully!';
          this.currentLyrics = response;
          // If the response has lyricsData, update our form
          if (response.lyricsData) {
            this.populateLyricsForm(response);
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to create lyrics. Please try again.';
          this.isSubmitting = false;
          console.error('Error creating lyrics:', error);
        }
      });
    }
  }

  playAudio(): void {
    if (this.audioPlayer && this.audioPlayer.nativeElement) {
      this.audioPlayer.nativeElement.play();
      this.isPlaying = true;
    }
  }

  pauseAudio(): void {
    if (this.audioPlayer && this.audioPlayer.nativeElement) {
      this.audioPlayer.nativeElement.pause();
      this.isPlaying = false;
    }
  }

  stopAudio(): void {
    if (this.audioPlayer && this.audioPlayer.nativeElement) {
      this.audioPlayer.nativeElement.pause();
      this.audioPlayer.nativeElement.currentTime = 0;
      this.isPlaying = false;
    }
  }

  onTimeUpdate(): void {
    if (this.audioPlayer && this.audioPlayer.nativeElement) {
      this.currentTime = Math.floor(this.audioPlayer.nativeElement.currentTime);
    }
  }

  addLyricAtCurrentTime(): void {
    this.addLyricsItem(this.currentTime);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  goBack(): void {
    this.router.navigate(['/admin/sounds']);
  }
}
