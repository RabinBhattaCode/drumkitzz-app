import Link from 'next/link';
import { BarChart3, Home as HomeIcon, Info, Lock, Play, ShoppingBag } from 'lucide-react';

type ChartEntry = {
  rank: number;
  trackTitle: string;
  artistName: string;
  spotifyUrl: string;
  youtubeUrl?: string;
  tier: 'Diamond' | 'Platinum' | 'Gold' | 'Silver';
  popularity: number;
};

const topChart: ChartEntry[] = Array.from({ length: 10 }).map((_, i) => ({
  rank: i + 1,
  trackTitle: `Demo Track ${i + 1}`,
  artistName: i % 2 === 0 ? 'IFUNO Artist' : 'Underground MC',
  spotifyUrl: 'https://open.spotify.com/track/3nAbcDEFghostface',
  youtubeUrl: i % 2 === 0 ? 'https://www.youtube.com/watch?v=U5r9CvDgJ_w' : undefined,
  tier: i < 3 ? 'Diamond' : i < 6 ? 'Platinum' : i < 8 ? 'Gold' : 'Silver',
  popularity: Math.max(10, 100 - i * 5),
}));

const newMusic: ChartEntry[] = Array.from({ length: 6 }).map((_, i) => ({
  rank: i + 1,
  trackTitle: `New Drop ${i + 1}`,
  artistName: i % 2 === 0 ? 'UK Drill' : 'UK Rap',
  spotifyUrl: 'https://open.spotify.com/track/7xyKidwildTrack',
  youtubeUrl: 'https://www.youtube.com/watch?v=kTiB8QFKDU8',
  tier: i < 2 ? 'Diamond' : i < 4 ? 'Platinum' : 'Gold',
  popularity: 80 - i * 7,
}));

function SaveButton() {
  return (
    <button className="inline-flex items-center space-x-2 rounded-md bg-ifuno-green px-3 py-2 text-xs font-semibold text-black hover:bg-ifuno-pink hover:text-white transition-colors">
      <Play className="w-4 h-4" />
      <span>Save to Spotify</span>
    </button>
  );
}

export default function ChartsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="bg-black/90 border-b border-ifuno-pink/40 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center h-16">
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-ifuno-green text-black hover:bg-ifuno-pink hover:text-white transition-all duration-200 text-sm font-medium uppercase"
              >
                <HomeIcon className="w-4 h-4" />
                <span>New</span>
              </Link>
              <Link
                href="/?section=leak"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-ifuno-pink transition-all duration-200 text-sm font-medium uppercase"
              >
                <Lock className="w-4 h-4" />
                <span>Leak</span>
              </Link>
            </div>

            <div className="flex justify-center">
              <Link href="/" className="hover:opacity-80 transition-opacity duration-200">
                <img
                  src="https://ik.imagekit.io/vv1coyjgq/IFUKNO%20large%20gap%202025.png?updatedAt=1751549577754"
                  alt="IFUNO Logo"
                  className="h-12 w-auto object-contain"
                />
              </Link>
            </div>

            <div className="flex items-center space-x-4 justify-end">
              <Link
                href="/charts"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-ifuno-pink/20 text-white border border-ifuno-pink/60 text-sm font-medium uppercase"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Charts</span>
              </Link>
              <Link
                href="/shop"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-ifuno-pink transition-all duration-200 text-sm font-medium uppercase"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop</span>
              </Link>
              <Link
                href="/about"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-ifuno-pink transition-all duration-200 text-sm font-medium uppercase"
              >
                <Info className="w-4 h-4" />
                <span>About</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <header className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-[0.2em]">IFUNO • CHARTS</p>
          <h1 className="text-4xl font-black title-stroke">IFUNO Charts</h1>
          <p className="text-gray-300 text-sm">
            Sample Top 500 and New Music charts using the spreadsheet-style data (Spotify artist links and matched videos).
          </p>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Top 500 (Sample)</h2>
            <p className="text-xs text-gray-400">Demo feed</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-ifuno-pink/40">
            <table className="min-w-full divide-y divide-ifuno-pink/30">
              <thead className="bg-black/60 text-xs uppercase tracking-wide text-gray-300">
                <tr>
                  <th className="px-3 py-3 text-left">Rank</th>
                  <th className="px-3 py-3 text-left">Track</th>
                  <th className="px-3 py-3 text-left">Artist</th>
                  <th className="px-3 py-3 text-left">Tier</th>
                  <th className="px-3 py-3 text-left">Popularity</th>
                  <th className="px-3 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ifuno-pink/20">
                {topChart.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-ifuno-pink/5">
                    <td className="px-3 py-3 text-sm text-gray-300">{entry.rank}</td>
                    <td className="px-3 py-3 text-sm font-semibold">{entry.trackTitle}</td>
                    <td className="px-3 py-3 text-sm text-gray-200">
                      {entry.artistName}
                      <a
                        href={entry.spotifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-ifuno-green text-xs underline"
                      >
                        Spotify
                      </a>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full border border-ifuno-pink/60 px-2 py-0.5 text-[11px] uppercase tracking-wide text-ifuno-green">
                        {entry.tier}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-300">{entry.popularity}</td>
                    <td className="px-3 py-3 space-y-2">
                      <SaveButton />
                      {entry.youtubeUrl && (
                        <a
                          href={entry.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-ifuno-green underline"
                        >
                          Watch video
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">New Music • This Week</h2>
            <p className="text-xs text-gray-400">Sample weekly slice</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {newMusic.map((entry) => (
              <div
                key={entry.rank}
                className="rounded-xl border border-ifuno-pink/30 bg-black/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Rank #{entry.rank}</p>
                    <h3 className="text-lg font-semibold">{entry.trackTitle}</h3>
                    <p className="text-sm text-gray-300">
                      {entry.artistName}
                      <a
                        href={entry.spotifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-ifuno-green underline"
                      >
                        Spotify
                      </a>
                    </p>
                  </div>
                  <span className="rounded-full border border-ifuno-pink/60 px-2 py-0.5 text-[11px] uppercase tracking-wide text-ifuno-green">
                    {entry.tier}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span>Popularity: {entry.popularity}</span>
                  <SaveButton />
                </div>
                {entry.youtubeUrl && (
                  <div className="text-right">
                    <a
                      href={entry.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-ifuno-green underline"
                    >
                      Watch video
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
