import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatchDetailService } from '../../../services/match-detail.service';
import { MatchDetail, MatchDetailResponse, Sound, SoundControlRequest } from '../../../models/match-detail.model';
import { isPlatformBrowser, CommonModule, DatePipe } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { catchError, finalize, takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-match-detail',
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe]
})
export class MatchDetailComponent implements OnInit, OnDestroy {
  matchId!: number;
  matchDetail: MatchDetail | null = null;
  sounds: Sound[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  private lastLoadTime = 0;
  private loadCooldownMs = 5000; // 5 seconds cooldown between loads
  
  scoreForm: FormGroup;
  statusOptions: Array<'PLANNED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'> = ['PLANNED', 'LIVE', 'COMPLETED', 'CANCELLED'];
  
  audioElements: { [key: number]: HTMLAudioElement } = {};
  private subscriptions: Subscription = new Subscription();
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private matchDetailService: MatchDetailService,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.scoreForm = this.fb.group({
      homeScore: [0, [Validators.required, Validators.min(0)]],
      awayScore: [0, [Validators.required, Validators.min(0)]]
    });
  }
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.matchId = +params['id'];
      if (this.matchId) {
        this.loadMatchDetail();
      } else {
        this.router.navigate(['/admin/matches']);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    
    // Clean up audio elements
    if (isPlatformBrowser(this.platformId)) {
      Object.values(this.audioElements).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      this.audioElements = {};
    }
  }
  
  loadMatchDetail(): void {
    const currentTime = new Date().getTime();
    
    // Check if we've loaded the data recently to prevent unnecessary API calls
    if (currentTime - this.lastLoadTime < this.loadCooldownMs && this.matchDetail) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.success = '';
    this.lastLoadTime = currentTime;
    
    this.subscriptions.add(
      this.matchDetailService.getMatchDetail(this.matchId)
        .pipe(
          catchError(err => {
            this.error = 'Failed to load match details. Please try again.';
            console.error('Error loading match details:', err);
            throw err;
          }),
          finalize(() => this.loading = false)
        )
        .subscribe((response: MatchDetailResponse) => {
          this.matchDetail = response.match;
          this.sounds = response.sounds.map(sound => {
            // Ensure all sounds have a valid imageUrl
            return {
              ...sound,
              imageUrl: sound.imageUrl || this.getDefaultImageUrl()
            };
          });
          
          // Update form values
          this.scoreForm.patchValue({
            homeScore: this.matchDetail.homeScore,
            awayScore: this.matchDetail.awayScore
          });
          
          // Initialize audio elements if in browser
          if (isPlatformBrowser(this.platformId)) {
            this.initializeAudioElements();
          }
        })
    );
  }
  
  initializeAudioElements(): void {
    // Clean up existing audio elements
    Object.values(this.audioElements).forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioElements = {};
    
    // Create new audio elements for each sound
    this.sounds.forEach(sound => {
      const audio = new Audio();
      audio.src = sound.soundUrl;
      audio.load();
      this.audioElements[sound.id] = audio;
      
      // If this sound is currently active and playing, start it
      if (this.matchDetail?.activeSoundId === sound.id && sound.status === 'PLAYING') {
        if (this.matchDetail.soundStartTime && this.matchDetail.elapsedTimeOnPause === null) {
          const startTime = new Date(this.matchDetail.soundStartTime).getTime();
          const currentTime = new Date().getTime();
          const elapsedTime = (currentTime - startTime) / 1000; // in seconds
          
          if (elapsedTime > 0) {
            audio.currentTime = elapsedTime;
            audio.play();
          }
        }
      }
    });
  }
  
  updateScore(): void {
    if (this.scoreForm.invalid) {
      return;
    }
    
    const { homeScore, awayScore } = this.scoreForm.value;
    this.loading = true;
    this.error = null;
    this.success = null;
    
    this.subscriptions.add(
      this.matchDetailService.updateMatchScore(this.matchId, homeScore, awayScore)
        .pipe(
          catchError(err => {
            this.error = 'Failed to update match score. Please try again.';
            console.error('Error updating match score:', err);
            throw err;
          }),
          finalize(() => this.loading = false)
        )
        .subscribe((updatedMatch: MatchDetail) => {
          this.matchDetail = updatedMatch;
          this.success = 'Match score updated successfully!';
          
          // Clear success message after 3 seconds
          setTimeout(() => this.success = null, 3000);
        })
    );
  }
  
  updateStatus(status: 'PLANNED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'): void {
    if (!this.matchDetail) {
      return;
    }
    
    this.loading = true;
    this.error = null;
    this.success = null;
    
    this.subscriptions.add(
      this.matchDetailService.updateMatchStatus(this.matchId, status)
        .pipe(
          catchError(err => {
            this.error = 'Failed to update match status. Please try again.';
            console.error('Error updating match status:', err);
            throw err;
          }),
          finalize(() => this.loading = false)
        )
        .subscribe((updatedMatch: MatchDetail) => {
          this.matchDetail = updatedMatch;
          this.success = 'Match status updated successfully!';
          
          // If match is completed or cancelled, stop any playing sounds
          if (status === 'COMPLETED' || status === 'CANCELLED') {
            Object.values(this.audioElements).forEach(audio => {
              audio.pause();
              audio.currentTime = 0;
            });
          }
          
          // Clear success message after 3 seconds
          setTimeout(() => this.success = null, 3000);
        })
    );
  }
  
  playSound(sound: Sound): void {
    if (!isPlatformBrowser(this.platformId) || !this.matchDetail) {
      return;
    }
    
    // Stop any currently playing audio
    Object.values(this.audioElements).forEach(audio => {
      audio.pause();
    });
    
    const audio = this.audioElements[sound.id];
    if (!audio) {
      return;
    }
    
    // Reset audio to beginning
    audio.currentTime = 0;
    
    const request: SoundControlRequest = {
      soundId: sound.id,
      action: 'PLAYING',
      startTime: new Date().toISOString(),
      currentMillisecond: 0
    };
    
    this.loading = true;
    this.error = null;
    this.success = null;
    
    this.subscriptions.add(
      this.matchDetailService.controlMatchSound(this.matchId, request)
        .pipe(
          catchError(err => {
            this.error = 'Failed to play sound. Please try again.';
            console.error('Error playing sound:', err);
            throw err;
          }),
          finalize(() => this.loading = false)
        )
        .subscribe((updatedMatch: MatchDetail) => {
          this.matchDetail = updatedMatch;
          audio.play();
          this.success = `Now playing: ${sound.title}`;
          
          // Clear success message after 3 seconds
          setTimeout(() => this.success = null, 3000);
        })
    );
  }
  
  pauseSound(sound: Sound): void {
    if (!isPlatformBrowser(this.platformId) || !this.matchDetail) {
      return;
    }
    
    const audio = this.audioElements[sound.id];
    if (!audio) {
      return;
    }
    
    const currentTime = audio.currentTime * 1000; // Convert to milliseconds
    
    const request: SoundControlRequest = {
      soundId: sound.id,
      action: 'PAUSED',
      elapsedTimeOnPause: currentTime,
      currentMillisecond: currentTime
    };
    
    this.loading = true;
    this.error = null;
    this.success = null;
    
    this.subscriptions.add(
      this.matchDetailService.controlMatchSound(this.matchId, request)
        .pipe(
          catchError(err => {
            this.error = 'Failed to pause sound. Please try again.';
            console.error('Error pausing sound:', err);
            throw err;
          }),
          finalize(() => this.loading = false)
        )
        .subscribe((updatedMatch: MatchDetail) => {
          this.matchDetail = updatedMatch;
          audio.pause();
          this.success = `Paused: ${sound.title}`;
          
          // Clear success message after 3 seconds
          setTimeout(() => this.success = null, 3000);
        })
    );
  }
  
  stopSound(sound: Sound): void {
    if (!isPlatformBrowser(this.platformId) || !this.matchDetail) {
      return;
    }
    
    const audio = this.audioElements[sound.id];
    if (!audio) {
      return;
    }
    
    const request: SoundControlRequest = {
      soundId: sound.id,
      action: 'STOPPED'
    };
    
    this.loading = true;
    this.error = null;
    this.success = null;
    
    this.subscriptions.add(
      this.matchDetailService.controlMatchSound(this.matchId, request)
        .pipe(
          catchError(err => {
            this.error = 'Failed to stop sound. Please try again.';
            console.error('Error stopping sound:', err);
            throw err;
          }),
          finalize(() => this.loading = false)
        )
        .subscribe((updatedMatch: MatchDetail) => {
          this.matchDetail = updatedMatch;
          audio.pause();
          audio.currentTime = 0;
          this.success = `Stopped: ${sound.title}`;
          
          // Clear success message after 3 seconds
          setTimeout(() => this.success = null, 3000);
        })
    );
  }
  
  isSoundActive(soundId: number): boolean {
    return this.matchDetail?.activeSoundId === soundId;
  }
  
  getSoundStatus(soundId: number): 'PLAYING' | 'PAUSED' | 'STOPPED' {
    const sound = this.sounds.find(s => s.id === soundId);
    return sound?.status || 'STOPPED';
  }
  
  navigateToMatches(): void {
    this.router.navigate(['/admin/matches']);
  }
  
  getDefaultImageUrl(): string {
    return 'https://via.placeholder.com/80x80?text=No+Image';
  }

  // Aktif ses dosyasının şu anki süresini döndürür (saniye cinsinden)
  getCurrentTime(soundId: number): number {
    if (!isPlatformBrowser(this.platformId) || !this.audioElements[soundId]) {
      return 0;
    }
    return this.audioElements[soundId].currentTime;
  }

  // Aktif ses dosyasının toplam süresini döndürür (saniye cinsinden)
  getTotalDuration(soundId: number): number {
    if (!isPlatformBrowser(this.platformId) || !this.audioElements[soundId]) {
      return 0;
    }
    return this.audioElements[soundId].duration || 0;
  }

  // Aktif ses dosyasının ilerleme yüzdesini döndürür
  getProgressPercentage(soundId: number): number {
    if (!isPlatformBrowser(this.platformId) || !this.audioElements[soundId]) {
      return 0;
    }
    const audio = this.audioElements[soundId];
    if (!audio.duration) return 0;
    return (audio.currentTime / audio.duration) * 100;
  }

  // Aktif sesi oynat
  playActiveSound(): void {
    if (!isPlatformBrowser(this.platformId) || !this.matchDetail?.activeSoundId) {
      return;
    }
    
    const activeSound = this.sounds.find(s => s.id === this.matchDetail?.activeSoundId);
    if (activeSound) {
      this.playSound(activeSound);
    }
  }

  // Aktif sesi duraklat
  pauseActiveSound(): void {
    if (!isPlatformBrowser(this.platformId) || !this.matchDetail?.activeSoundId) {
      return;
    }
    
    const activeSound = this.sounds.find(s => s.id === this.matchDetail?.activeSoundId);
    if (activeSound) {
      this.pauseSound(activeSound);
    }
  }

  // Aktif sesi durdur
  stopActiveSound(): void {
    if (!isPlatformBrowser(this.platformId) || !this.matchDetail?.activeSoundId) {
      return;
    }
    
    const activeSound = this.sounds.find(s => s.id === this.matchDetail?.activeSoundId);
    if (activeSound) {
      this.stopSound(activeSound);
    }
  }
}
