export interface Match {
  id?: number;
  name: string;
  teamId: number;
  teamName?: string;
  opponentTeamId: number;
  opponentTeamName?: string;
  location: string;
  matchDate: string;
  homeScore?: number;
  awayScore?: number;
  status?: MatchStatus;
  activeSoundId?: number | null;
  activeSoundTitle?: string | null;
  soundStartTime?: string | null;
  elapsedTimeOnPause?: string | null;
}

export enum MatchStatus {
  PLANNED = 'PLANNED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
