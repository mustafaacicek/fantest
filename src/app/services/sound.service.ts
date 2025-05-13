import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sound } from '../models/sound.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private apiUrl = `${environment.apiUrl}/api/admin/sounds`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Get all sounds for the admin's team
  getMyTeamSounds(): Observable<Sound[]> {
    return this.http.get<Sound[]>(this.apiUrl);
  }

  // Get sound by ID
  getSoundById(id: number): Observable<Sound> {
    return this.http.get<Sound>(`${this.apiUrl}/${id}`);
  }

  // Create a new sound
  createSound(sound: Sound): Observable<Sound> {
    // Create a copy of the sound object to avoid modifying the original
    const soundToCreate = { ...sound };
    
    // Use the current user's team ID
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.teamId) {
      soundToCreate.teamId = currentUser.teamId;
    }
    
    // Remove playlistOrder if it's included
    if (soundToCreate.playlistOrder !== undefined) {
      delete soundToCreate.playlistOrder;
    }
    
    return this.http.post<Sound>(this.apiUrl, soundToCreate);
  }

  // Update an existing sound
  updateSound(id: number, sound: Partial<Sound>): Observable<Sound> {
    return this.http.put<Sound>(`${this.apiUrl}/${id}`, sound);
  }

  // Delete a sound
  deleteSound(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
