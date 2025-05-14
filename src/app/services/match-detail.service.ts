import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MatchDetail, MatchDetailResponse, SoundControlRequest } from '../models/match-detail.model';

@Injectable({
  providedIn: 'root'
})
export class MatchDetailService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get match details and team sounds
   * @param matchId The ID of the match
   * @returns Observable of match details and sounds
   */
  getMatchDetail(matchId: number): Observable<MatchDetailResponse> {
    return this.http.get<MatchDetailResponse>(`${this.baseUrl}/api/admin/match-detail/${matchId}`);
  }

  /**
   * Update match score
   * @param matchId The ID of the match
   * @param homeScore Home team score
   * @param awayScore Away team score
   * @returns Observable of updated match details
   */
  updateMatchScore(matchId: number, homeScore: number, awayScore: number): Observable<MatchDetail> {
    return this.http.put<MatchDetail>(
      `${this.baseUrl}/api/admin/match-detail/${matchId}/score`,
      null,
      { params: { homeScore: homeScore.toString(), awayScore: awayScore.toString() } }
    );
  }

  /**
   * Update match status
   * @param matchId The ID of the match
   * @param status New match status
   * @returns Observable of updated match details
   */
  updateMatchStatus(matchId: number, status: 'PLANNED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'): Observable<MatchDetail> {
    return this.http.put<MatchDetail>(
      `${this.baseUrl}/api/admin/match-detail/${matchId}/status`,
      null,
      { params: { status } }
    );
  }

  /**
   * Control match sound (play, pause, stop)
   * @param matchId The ID of the match
   * @param request Sound control request
   * @returns Observable of updated match details
   */
  controlMatchSound(matchId: number, request: SoundControlRequest): Observable<MatchDetail> {
    return this.http.post<MatchDetail>(
      `${this.baseUrl}/api/admin/match-detail/${matchId}/sound`,
      request
    );
  }
}
