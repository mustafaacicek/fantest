export interface MatchDetail {
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
  soundStartTime: string | null;
  elapsedTimeOnPause: number | null;
}

export interface MatchDetailResponse {
  match: MatchDetail;
  sounds: Sound[];
}

export interface Sound {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  creatorId: number;
  creatorUsername: string;
  soundUrl: string;
  teamId: number;
  teamName: string;
  playlistOrder: number;
  status: 'PLAYING' | 'PAUSED' | 'STOPPED';
}

export interface SoundControlRequest {
  soundId: number;
  action: 'PLAYING' | 'PAUSED' | 'STOPPED';
  startTime?: string;
  elapsedTimeOnPause?: number | null;
  currentMillisecond?: number;
}
