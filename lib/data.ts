import { IfunoChartEntry, IfunoTrack, IfunoVideo } from "./types";

const videos: IfunoVideo[] = [
  {
    id: "video-1",
    youtubeVideoId: "Uc9FV46y4dI",
    youtubeTitle: "Clavish ft Chy Cartier - CC Walk (Official Music Video)",
    youtubeChannelName: "GRM Daily",
    spotifyTrackId: "6rqhFgbbKwnb9MLmUQDhG6",
    spotifyTrackUrl: "https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6",
    spotifyArtistId: "1vCWHaC5f2uS3yhpwWbIA6",
    artistName: "Clavish",
    trackTitle: "CC Walk",
    chartRank: 42,
    chartTier: "Platinum",
  },
];

const top500: IfunoChartEntry[] = Array.from({ length: 10 }).map((_, i) => ({
  rank: i + 1,
  trackId: `track-${i + 1}`,
  trackTitle: `Track ${i + 1}`,
  artistName: `Artist ${i + 1}`,
  spotifyTrackId: "6rqhFgbbKwnb9MLmUQDhG6",
  spotifyTrackUrl: "https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6",
  spotifyPopularity: 80 - i,
  tier: i < 3 ? "Diamond" : i < 5 ? "Platinum" : "Gold",
}));

const newThisWeek: IfunoTrack[] = [
  {
    id: "new-1",
    title: "Fresh Drop",
    spotifyTrackId: "6rqhFgbbKwnb9MLmUQDhG6",
    spotifyTrackUrl: "https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6",
    spotifyArtistId: "1vCWHaC5f2uS3yhpwWbIA6",
    spotifyPopularity: 75,
    releaseDate: new Date().toISOString(),
    isNewThisWeek: true,
    artistName: "New Artist",
  },
];

export async function getTop500Chart(): Promise<IfunoChartEntry[]> {
  return top500;
}

export async function getNewMusicChartForCurrentWeek(): Promise<IfunoChartEntry[]> {
  return newThisWeek.map((t, idx) => ({
    rank: idx + 1,
    trackId: t.id,
    trackTitle: t.title,
    artistName: t.artistName,
    spotifyTrackId: t.spotifyTrackId,
    spotifyTrackUrl: t.spotifyTrackUrl,
    spotifyPopularity: t.spotifyPopularity,
    tier: idx < 1 ? "Diamond" : "Platinum",
  }));
}

export async function getVideoById(id: string): Promise<IfunoVideo | null> {
  return videos.find((v) => v.id === id) || null;
}
