import { IfunoArtist, IfunoChartEntry, IfunoVideo } from './ifuno-types';

// Minimal in-memory dataset so UI can render without external APIs.
const demoArtists: IfunoArtist[] = [
  {
    id: 'artist-ghostface600',
    name: 'Ghostface600',
    spotifyArtistId: '2kGhostfaceArtist',
    spotifyProfileUrl: 'https://open.spotify.com/artist/2kGhostfaceArtist',
    spotifyFollowers: 120000,
    genres: ['uk drill'],
  },
  {
    id: 'artist-kidwild',
    name: 'Kidwild',
    spotifyArtistId: '4kKidwildArtist',
    spotifyProfileUrl: 'https://open.spotify.com/artist/4kKidwildArtist',
    spotifyFollowers: 55000,
    genres: ['uk rap'],
  },
];

const demoVideos: IfunoVideo[] = [
  {
    id: 'demo-1',
    youtubeVideoId: 'U5r9CvDgJ_w',
    youtubeTitle: 'Ghostface600 - Badmind (Official Music Video)',
    youtubeChannelName: 'Ghostface600',
    spotifyTrackId: '3nAbcDEFghostface',
    spotifyTrackUrl: 'https://open.spotify.com/track/3nAbcDEFghostface',
    spotifyArtistId: '2kGhostfaceArtist',
    artistName: 'Ghostface600',
    trackTitle: 'Badmind',
    chartRank: 12,
    chartTier: 'Platinum',
  },
  {
    id: 'demo-2',
    youtubeVideoId: 'kTiB8QFKDU8',
    youtubeTitle: 'Kidwild - Forgive Me [Music Video]',
    youtubeChannelName: 'Kidwild',
    spotifyTrackId: '7xyKidwildTrack',
    spotifyTrackUrl: 'https://open.spotify.com/track/7xyKidwildTrack',
    spotifyArtistId: '4kKidwildArtist',
    artistName: 'Kidwild',
    trackTitle: 'Forgive Me',
    chartRank: 220,
    chartTier: 'Gold',
  },
];

const demoChart: IfunoChartEntry[] = Array.from({ length: 20 }).map((_, i) => ({
  rank: i + 1,
  trackId: `track-${i + 1}`,
  trackTitle: `Demo Track ${i + 1}`,
  artistName: i % 2 === 0 ? 'IFUNO Artist' : 'Underground MC',
  spotifyTrackId: `spotifyTrack${i + 1}`,
  spotifyTrackUrl: `https://open.spotify.com/track/spotifyTrack${i + 1}`,
  spotifyPopularity: Math.max(10, 100 - i * 3),
  tier: i < 5 ? 'Diamond' : i < 10 ? 'Platinum' : i < 15 ? 'Gold' : 'Silver',
}));

export async function getTop500Chart(): Promise<IfunoChartEntry[]> {
  return demoChart;
}

export async function getNewMusicChartForCurrentWeek(): Promise<IfunoChartEntry[]> {
  // In a real build this would filter by release window; here we just slice a handful.
  return demoChart.slice(0, 10).map((entry) => ({ ...entry, rank: entry.rank }));
}

export async function getVideoById(id: string): Promise<IfunoVideo | null> {
  return demoVideos.find((video) => video.id === id) || null;
}

export async function listVideos(): Promise<IfunoVideo[]> {
  return demoVideos;
}

export async function getVideoByTrackId(trackId: string): Promise<IfunoVideo | null> {
  return demoVideos.find((video) => video.spotifyTrackId === trackId) || null;
}

export async function getArtistBySpotifyId(spotifyArtistId: string): Promise<IfunoArtist | null> {
  return demoArtists.find((artist) => artist.spotifyArtistId === spotifyArtistId) || null;
}
