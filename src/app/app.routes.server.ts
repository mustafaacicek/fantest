import { RenderMode, ServerRoute } from '@angular/ssr';

interface Match {
  id: number;
}

interface Lyric {
  id: number;
}

export const serverRoutes: ServerRoute[] = [
  {
    path: 'admin/match-detail/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      try {
        const response = await fetch('http://localhost:8080/api/admin/matches');
        const matches: Match[] = await response.json();
        return matches.map((match: Match) => ({ id: match.id.toString() }));
      } catch (error) {
        // Fallback IDs for prerendering
        return [{ id: '1' }, { id: '2' }, { id: '3' }];
      }
    }
  },
  {
    path: 'admin/lyrics/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      try {
        const response = await fetch('http://localhost:8080/api/admin/lyrics');
        const lyrics: Lyric[] = await response.json();
        return lyrics.map((lyric: Lyric) => ({ id: lyric.id.toString() }));
      } catch (error) {
        // Fallback IDs for prerendering
        return [{ id: '1' }, { id: '2' }, { id: '3' }];
      }
    }
  },
  {
    path: 'match-detail/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      try {
        const response = await fetch('http://localhost:8080/api/matches');
        const matches: Match[] = await response.json();
        return matches.map((match: Match) => ({ id: match.id.toString() }));
      } catch (error) {
        // Fallback IDs for prerendering
        return [{ id: '1' }, { id: '2' }, { id: '3' }];
      }
    }
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
