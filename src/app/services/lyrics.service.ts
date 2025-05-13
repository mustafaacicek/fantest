import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lyrics, LyricsItem } from '../models/lyrics.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LyricsService {
  private apiUrl = `${environment.apiUrl}/api/admin/lyrics`;

  constructor(private http: HttpClient) { }

  // Get all lyrics for the admin's team
  getMyTeamLyrics(): Observable<Lyrics[]> {
    return this.http.get<Lyrics[]>(this.apiUrl);
  }

  // Get lyrics by ID
  getLyricsById(id: number): Observable<Lyrics> {
    return this.http.get<Lyrics>(`${this.apiUrl}/${id}`);
  }

  // Get lyrics by sound ID
  getLyricsBySoundId(soundId: number): Observable<Lyrics> {
    return this.http.get<Lyrics>(`${this.apiUrl}/sound/${soundId}`);
  }

  // Create new lyrics
  createLyrics(lyrics: Lyrics): Observable<Lyrics> {
    // Make sure we're sending the right format
    // Ensure lyricsData is a proper array of objects, not a nested JSON string
    const payload = {
      soundId: lyrics.soundId,
      lyricsData: Array.isArray(lyrics.lyricsData) ? 
        lyrics.lyricsData.map(item => ({
          lyric: typeof item.lyric === 'string' ? item.lyric : JSON.stringify(item.lyric),
          second: Number(item.second)
        })) : []
    };
    
    console.log('Creating lyrics with payload:', payload);
    return this.http.post<Lyrics>(this.apiUrl, payload);
  }

  // Update existing lyrics
  updateLyrics(id: number, lyrics: Partial<Lyrics>): Observable<Lyrics> {
    // Make sure we're sending the right format
    // Ensure lyricsData is a proper array of objects, not a nested JSON string
    const payload = {
      soundId: lyrics.soundId,
      lyricsData: Array.isArray(lyrics.lyricsData) ? 
        lyrics.lyricsData.map(item => ({
          lyric: typeof item.lyric === 'string' ? item.lyric : JSON.stringify(item.lyric),
          second: Number(item.second)
        })) : []
    };
    
    console.log('Updating lyrics with payload:', payload);
    return this.http.put<Lyrics>(`${this.apiUrl}/${id}`, payload);
  }

  // Delete lyrics
  deleteLyrics(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
