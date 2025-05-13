export interface Sound {
  id?: number;
  title: string;
  description?: string;
  imageUrl?: string;
  creatorId?: number;
  creatorUsername?: string;
  soundUrl: string;
  teamId: number;
  teamName?: string;
  playlistOrder?: number;
  status?: SoundStatus;
}

export enum SoundStatus {
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED'
}
