import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { DatePipe } from '@angular/common';

interface MatchDetail {
  id: number;
  name: string;
  teamId: number;
  teamName: string;
  opponentTeamId: number;
  opponentTeamName: string;
  location: string;
  matchDate: string;
  homeScore: number;
  awayScore: number;
  status: 'PLANNED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  activeSoundId: number | null;
  activeSoundTitle: string | null;
  activeSoundUrl: string | null;
  soundStatus?: 'PLAYING' | 'PAUSED' | null;
  soundStartTime: string | null;
  currentMillisecond: number | null;
  activeSoundLyrics: string | null;
}

interface Lyric {
  lyric: string;
  second: number;
}

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="match-detail-container">
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner-galaxy">
          <div class="circle"></div>
          <div class="circle"></div>
          <div class="circle"></div>
        </div>
        <p class="loading-text">Maç bilgileri yükleniyor<span>.</span><span>.</span><span>.</span></p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 class="glass-text">Bir hata oluştu</h3>
        <p>{{ errorMessage }}</p>
        <button class="btn-neon" (click)="goBack()">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          Geri Dön
        </button>
      </div>

      <!-- Match Content -->
      <div *ngIf="!loading && !error" class="match-content">
        <!-- Header with back button -->
        <div class="match-header">
          <button class="btn-glass" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div class="match-status" [ngClass]="getStatusClass(match?.status || '')">
            <div class="status-icon">
              <i class="fas" [ngClass]="{
                'fa-play-circle': match?.status === 'LIVE',
                'fa-calendar-check': match?.status === 'PLANNED',
                'fa-flag-checkered': match?.status === 'COMPLETED',
                'fa-ban': match?.status === 'CANCELLED'
              }"></i>
            </div>
            <span>{{ getStatusText(match?.status || '') }}</span>
          </div>
        </div>

        <!-- Match Info Card -->
        <div class="match-info-card">
          <div class="card-glass-effect"></div>
          <div class="match-date">
            <i class="fas fa-calendar-alt"></i>
            {{ formatDate(match?.matchDate || '') }}
          </div>
          <div class="match-location">
            <i class="fas fa-map-marker-alt"></i>
            {{ match?.location || 'Konum bilgisi yok' }}
          </div>
          
          <div class="teams-container">
            <div class="team home-team">
              <div class="team-logo">
                <!-- Placeholder for team logo with glow effect -->
                <div class="logo-hexagon">
                  <div class="logo-content">{{ match?.teamName?.charAt(0) || 'T' }}</div>
                </div>
              </div>
              <div class="team-name">{{ match?.teamName || 'Ev Sahibi' }}</div>
            </div>

            <div class="score-container">
              <div class="score">
                <div class="score-box home-score">{{ match?.homeScore || 0 }}</div>
                <div class="score-separator">-</div>
                <div class="score-box away-score">{{ match?.awayScore || 0 }}</div>
              </div>
              <div class="match-name">{{ match?.name || 'Maç' }}</div>
              <div class="vs-badge">VS</div>
            </div>

            <div class="team away-team">
              <div class="team-logo">
                <!-- Placeholder for opponent team logo with glow effect -->
                <div class="logo-hexagon away">
                  <div class="logo-content">{{ match?.opponentTeamName?.charAt(0) || 'O' }}</div>
                </div>
              </div>
              <div class="team-name">{{ match?.opponentTeamName || 'Deplasman' }}</div>
            </div>
          </div>
        </div>

        <!-- Tribune Join Section -->
        <div class="tribune-section" *ngIf="!isConnected">
          <div class="tribune-info">
            <div class="section-icon">
              <i class="fas fa-users"></i>
            </div>
            <h3 class="glow-text">Taraftar Tribününe Katıl</h3>
            <p>Maçı canlı takip et, tezahüratları dinle ve taraftarlarla birlikte şarkı söyle!</p>
          </div>
          <button 
            class="btn-holographic" 
            [disabled]="isJoining" 
            (click)="joinTribune()">
            <div class="btn-background"></div>
            <div class="btn-content">
              <i class="fas fa-bullhorn"></i>
              <span *ngIf="!isJoining">Tribüne Katıl</span>
              <span *ngIf="isJoining">
                <div class="spinner-dots">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                </div>
                Bağlanıyor
              </span>
            </div>
          </button>
        </div>

        <!-- Live Match Experience (when connected) -->
        <div class="live-experience" *ngIf="isConnected">
          <div class="experience-background"></div>
          
          <!-- Current Sound Info -->
          <div class="sound-info" *ngIf="match?.activeSoundTitle">
            <div class="sound-icon" [ngClass]="{'pulsing': isPlaying}">
              <div class="sound-waves" *ngIf="isPlaying">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <i class="fas" [ngClass]="isPlaying ? 'fa-volume-up' : 'fa-volume-mute'"></i>
            </div>
            <div class="sound-details">
              <div class="sound-title">{{ match?.activeSoundTitle }}</div>
              <div class="sound-status">
                <span class="status-badge" [ngClass]="{'playing': isPlaying}">
                  <i class="fas" [ngClass]="isPlaying ? 'fa-play' : 'fa-pause'"></i>
                  {{ isPlaying ? 'Şimdi Çalıyor' : 'Duraklatıldı' }}
                </span>
              </div>
            </div>
          </div>

          <!-- No Active Sound Message -->
          <div class="no-sound-message" *ngIf="isConnected && !match?.activeSoundTitle">
            <div class="message-icon">
              <i class="fas fa-music"></i>
            </div>
            <p>Şu anda aktif bir tezahürat yok. Maç yöneticisi bir tezahürat başlattığında burada görünecek.</p>
          </div>

          <!-- Lyrics Display -->
          <div class="lyrics-container" *ngIf="currentLyric && isPlaying">
            <div class="lyrics-display" [ngClass]="{'pulsing-text': isPlaying}">
              <div class="lyrics-background"></div>
              <div class="lyrics-content">{{ currentLyric }}</div>
            </div>
          </div>

          <!-- Connection Status -->
          <div class="connection-status">
            <div class="status-indicator" [ngClass]="{'connected': isConnected}">
              <div class="pulse-ring" *ngIf="isConnected"></div>
            </div>
            <span>{{ isConnected ? 'Tribüne Bağlı' : 'Bağlantı Kesik' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,

  styleUrls: ['./match-detail.component.scss'],
  providers: [DatePipe]
})
export class MatchDetailComponent implements OnInit, OnDestroy {
  matchId!: number;
  match: MatchDetail | null = null;
  loading = true;
  error = false;
  errorMessage = '';

  // WebSocket related properties
  socket: WebSocket | null = null;
  isJoining = false;
  isConnected = false;

  // Audio related properties
  audio: HTMLAudioElement | null = null;
  isPlaying = false;
  lyrics: Lyric[] = [];
  currentLyric = '';
  currentMillisecond = 0;
  localStartTime = 0;
  timerSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.matchId = +id;
        this.loading = false;
      } else {
        console.error('No match ID provided');
        this.error = true;
        this.errorMessage = 'No match ID provided';
      }
    });
  }

  joinTribune(): void {
    if (this.isJoining || this.isConnected) return;

    this.isJoining = true;

    try {
      // Create WebSocket connection
      const wsUrl = `ws://localhost:8080/match-socket/${this.matchId}`;
      this.socket = new WebSocket(wsUrl);

      // Configure WebSocket events
      this.socket.onopen = (event) => {
        console.log('WebSocket connection opened:', event);
        this.isConnected = true;
        this.isJoining = false;
      };

      this.socket.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          this.handleWebSocketMessage(messageData);

          // İlk bağlantıda maç bilgilerini göster
          if (!this.match) {
            this.match = messageData;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
        this.isConnected = false;
        this.cleanupResources();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isJoining = false;
        this.error = true;
        this.errorMessage = 'Tribüne katılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isJoining = false;
      this.error = true;
      this.errorMessage = 'Tribüne katılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
    }
  }

  handleWebSocketMessage(message: any): void {
    if (!message || message.id !== this.matchId) return;

    console.log('WebSocket message received:', message);

    // Update match data
    this.match = {
      ...this.match,
      ...message
    };

    // Update lyrics if available
    if (message.activeSoundLyrics) {
      this.lyrics = this.parseLyrics(message.activeSoundLyrics);
    }

    // STOPPED durumunu işle
    if (message.soundStatus === 'STOPPED') {
      console.log('Sound STOPPED received');
      // Ses dosyasını durdur ve temizle
      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
        this.audio = null;
      }
      this.isPlaying = false;
      this.currentMillisecond = 0;
      this.currentLyric = '';
      
      // Timer'i durdur
      if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
        this.timerSubscription = null;
      }
      
      return; // STOPPED durumunda diğer işlemleri yapma
    }

    // Handle audio playback based on soundStatus
    if (message.activeSoundUrl) {
      if (!this.audio || this.audio.src !== message.activeSoundUrl) {
        // New sound or first time receiving sound
        this.initializeAudio(message.activeSoundUrl, message.currentMillisecond || 0);
      } else if (this.audio) {
        // Sadece ilk geldiğinde currentMillisecond'ı güncelle, sonra kendi içimizde sayacağız
        if (!this.isPlaying) {
          this.currentMillisecond = message.currentMillisecond || 0;
          this.syncAudioPosition();
        }

        // If the server says it's playing, make sure we're playing
        if (message.soundStatus === 'PLAYING' && !this.isPlaying) {
          this.audio.play()
            .then(() => {
              this.isPlaying = true;
              this.startLocalTimer();
            })
            .catch(error => console.error('Error playing audio:', error));
        } else if (message.soundStatus === 'PAUSED' && this.isPlaying) {
          // Pause if currently playing but server says paused
          this.audio.pause();
          this.isPlaying = false;
          if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
            this.timerSubscription = null;
          }
        }
      }
    } else if (!message.activeSoundUrl && this.audio) {
      // Sound URL yok, temizle
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
      this.isPlaying = false;
      this.currentLyric = '';
      if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
        this.timerSubscription = null;
      }
    }

    // Update current lyric based on current millisecond
    this.updateCurrentLyric(message.currentMillisecond || 0);
  }

  parseLyrics(lyricsJson: string | null): Lyric[] {
    if (!lyricsJson) return [];
    
    try {
      // Farklı formatlara uyum sağlamak için önce string formatını düzelt
      let cleanJson = lyricsJson;
      
      // Eğer JSON formatında değilse düzelt
      if (lyricsJson.includes('lyric=') && lyricsJson.includes('second=')) {
        // "{lyric=sadasdasd, second=0}" formatını düzelt
        cleanJson = lyricsJson
          .replace(/\[\{/g, '[{')
          .replace(/\}\]/g, '}]')
          .replace(/lyric=/g, '"lyric":"')
          .replace(/, second=/g, '", "second":')
          .replace(/\}, \{/g, '}, {')
          .replace(/\}\]/g, '}]');
      }
      
      // JSON olarak parse et
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Error parsing lyrics JSON:', error, lyricsJson);
      
      // Manuel parse etmeyi dene
      try {
        if (lyricsJson.includes('lyric=') && lyricsJson.includes('second=')) {
          // String'i manuel olarak parse et
          const lyricsArray: Lyric[] = [];
          const matches = lyricsJson.match(/\{lyric=([^,]+), second=(\d+)\}/g);
          
          if (matches) {
            matches.forEach(match => {
              const lyricMatch = match.match(/lyric=([^,]+)/);
              const secondMatch = match.match(/second=(\d+)/);
              
              if (lyricMatch && secondMatch) {
                lyricsArray.push({
                  lyric: lyricMatch[1],
                  second: parseInt(secondMatch[1], 10)
                });
              }
            });
          }
          
          return lyricsArray;
        }
      } catch (manualError) {
        console.error('Error manual parsing lyrics:', manualError);
      }
      
      return [];
    }
  }

  updateCurrentLyric(currentMs: number): void {
    if (!this.lyrics.length) return;
    
    // Convert milliseconds to seconds
    const currentSecond = Math.floor(currentMs / 1000);
    
    // Find the lyric that should be displayed at the current time
    const currentLyric = this.lyrics.find((lyric, index) => {
      const nextLyric = this.lyrics[index + 1];
      return lyric.second <= currentSecond && (!nextLyric || nextLyric.second > currentSecond);
    });
    
    // Update the current lyric
    if (currentLyric) {
      this.currentLyric = currentLyric.lyric;
      console.log(`Showing lyric at ${currentSecond}s: ${this.currentLyric}`);
    } else {
      this.currentLyric = '';
    }
  }

  initializeAudio(url: string, startPosition: number): void {
    // If there's already an audio element playing, stop it
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.isPlaying = false;
      if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
        this.timerSubscription = null;
      }
    }

    // Create a new audio element
    this.audio = new Audio(url);

    // Store the current millisecond position from the server
    this.currentMillisecond = startPosition;
    this.localStartTime = Date.now();

    // Set the start position (convert from milliseconds to seconds)
    if (startPosition) {
      this.audio.currentTime = startPosition / 1000;
    }

    // Add event listeners
    this.audio.addEventListener('canplay', () => {
      if (this.audio && this.match?.soundStatus === 'PLAYING') {
        this.audio.play()
          .then(() => {
            this.isPlaying = true;
            this.startLocalTimer();
          })
          .catch((error) => {
            console.error('Error playing audio:', error);
          });
      }
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
        this.timerSubscription = null;
      }
    });

    // Load the audio
    this.audio.load();
  }

  // Start a local timer to keep track of the current position
  startLocalTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    // Mevcut zamanı kaydet
    this.localStartTime = Date.now();
    const startMillisecond = this.currentMillisecond;
    
    // Daha hızlı güncelleme için 50ms aralıklarla kontrol et
    this.timerSubscription = interval(50).subscribe(() => {
      if (this.isPlaying) {
        // Geçen süreyi hesapla ve başlangıç milisaniyesine ekle
        const elapsedTime = Date.now() - this.localStartTime;
        this.currentMillisecond = startMillisecond + elapsedTime;
        
        // Audio pozisyonunu güncelle (her 500ms'de bir)
        if (elapsedTime % 500 === 0 && this.audio) {
          // Audio pozisyonu ile currentMillisecond arasında 1 saniyeden fazla fark varsa senkronize et
          const audioPositionMs = this.audio.currentTime * 1000;
          if (Math.abs(audioPositionMs - this.currentMillisecond) > 1000) {
            this.syncAudioPosition();
          }
        }
        
        // Şarkı sözlerini güncelle
        this.updateCurrentLyric(this.currentMillisecond);
      }
    });
  }

  // Sync the audio position with the server's currentMillisecond
  syncAudioPosition(): void {
    if (!this.audio || this.currentMillisecond === null || this.currentMillisecond === undefined) return;

    // Set audio position to match the server's currentMillisecond
    this.audio.currentTime = this.currentMillisecond / 1000;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return this.datePipe.transform(date, 'dd MMMM yyyy, HH:mm') || '';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PLANNED':
        return 'status-planned';
      case 'LIVE':
        return 'status-live';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatusText(status: string): string {
    if (!status) return '';

    switch (status.toUpperCase()) {
      case 'LIVE':
        return 'CANLI';
      case 'COMPLETED':
        return 'TAMAMLANDI';
      case 'PLANNED':
        return 'PLANLANMIŞ';
      case 'CANCELLED':
        return 'İPTAL EDİLDİ';
      default:
        return status;
    }
  }

  goBack(): void {
    if (this.match) {
      this.router.navigate(['/fan/teams', this.match.teamId, 'matches']);
    } else {
      this.router.navigate(['/fan/countries']);
    }
  }

  // Clean up resources
  cleanupResources(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }

    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }

  ngOnDestroy(): void {
    // Close WebSocket connection
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.cleanupResources();
  }
}
