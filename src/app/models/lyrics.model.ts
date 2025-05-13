export interface Lyrics {
  id?: number;
  soundId: number;
  soundTitle?: string;
  lyricsText?: string;
  lyricsData?: LyricsItem[];
}

export interface LyricsItem {
  lyric: string;
  second: number;
}
