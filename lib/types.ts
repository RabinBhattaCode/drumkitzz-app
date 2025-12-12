export interface IfunoArtist {
  id: string;
  name: string;
  spotifyArtistId: string;
  spotifyProfileUrl: string;
  spotifyFollowers: number;
}

export interface IfunoTrack {
  id: string;
  title: string;
  spotifyTrackId: string;
  spotifyTrackUrl: string;
  spotifyArtistId: string;
  spotifyPopularity: number;
  releaseDate: string;
  isNewThisWeek: boolean;
  artistName: string;
}

export type ChartTier = "Diamond" | "Platinum" | "Gold" | "Silver";

export interface IfunoChartEntry {
  rank: number;
  trackId: string;
  trackTitle: string;
  artistName: string;
  spotifyTrackId: string;
  spotifyTrackUrl: string;
  spotifyPopularity: number;
  tier: ChartTier;
}

export interface IfunoVideo {
  id: string;
  youtubeVideoId: string;
  youtubeTitle: string;
  youtubeChannelName: string;
  spotifyTrackId: string;
  spotifyTrackUrl: string;
  spotifyArtistId: string;
  artistName: string;
  trackTitle: string;
  chartRank?: number;
  chartTier?: ChartTier;
}
