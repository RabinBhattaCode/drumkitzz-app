import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { slugForItem } from '@/lib/slug';

export const dynamic = 'force-dynamic';

type MusicItem = {
  source?: string;
  title?: string;
  artist?: string;
  thumbnail_url?: string;
  embed_url?: string;
  video_url?: string;
  track_title_clean?: string;
  published_at?: string;
  view_count?: string;
};

type MusicData = Record<string, MusicItem[]>;

const DATA_PATH = path.join(process.cwd(), 'public', 'data.json');

const loadData = (): MusicData => {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data.json', err);
    return {};
  }
};

const findBySlug = (slug: string) => {
  const data = loadData();
  for (const [date, items] of Object.entries(data)) {
    for (const item of items || []) {
      if (slugForItem(item) === slug) {
        return { date, item };
      }
    }
  }
  return null;
};

export const generateMetadata = ({ params }: { params: { slug: string } }): Metadata => {
  const found = findBySlug(params.slug);
  if (!found) return {};
  const { item } = found;
  const titleText = `${item.artist || 'Artist'} – ${item.title || 'Track'} | IFUNO`;
  const description = `Watch ${item.artist || 'artist'} - ${item.title || 'track'} on IFUNO. Latest UK rap, drill, grime, and underground releases.`;
  const canonical = `https://ifuno.uk/video/${params.slug}`;

  return {
    title: titleText,
    description,
    alternates: { canonical },
    openGraph: {
      title: titleText,
      description,
      type: 'video.other',
      url: canonical,
      images: item.thumbnail_url ? [{ url: item.thumbnail_url, alt: `${item.artist} - ${item.title}` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: titleText,
      description,
      images: item.thumbnail_url ? [item.thumbnail_url] : undefined,
    },
  };
};

export default function VideoDetail({ params }: { params: { slug: string } }) {
  const found = findBySlug(params.slug);

  if (!found) {
    notFound();
  }

  const { item, date } = found!;
  const displayTitle = item.title || 'Untitled';
  const displayArtist = item.artist || '';
  const publishedDate = item.published_at
    ? new Date(item.published_at).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : date;

  const templates = [
    '{artist} returns with “{title}”, an official drop for the underground crowd. Expect clean, radio, instrumental, acapella, sped-up, and slowed-down cuts.',
    'New from {artist}: “{title}”. A UK underground-ready release with versions for every vibe — clean, radio, instrumental, acapella, sped up, slowed down.',
    '“{title}” by {artist} lands as an official release. Spin it in clean, radio edit, instrumental, acapella, sped-up, or slowed-down flavors.',
    '{artist} drops “{title}” for UK rap/drill heads. Enjoy the clean, radio, instrumental, acapella, sped-up, and slowed-down editions.',
  ];
  const safeArtist = displayArtist || 'This artist';
  const hash = params.slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const chosen = templates[hash % templates.length]
    .replace('{artist}', safeArtist)
    .replace('{title}', displayTitle);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Top nav / logo */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200">
            <img
              src="https://ik.imagekit.io/vv1coyjgq/IFUKNO%20large%20gap%202025.png?updatedAt=1751549577754"
              alt="IFUNO Logo"
              className="h-10 w-auto object-contain"
            />
            <span className="text-sm text-gray-300 uppercase tracking-wide">Back to releases</span>
          </Link>
          <div className="flex items-center space-x-3 text-sm">
            <Link href="/" className="text-gray-300 hover:text-ifuno-green transition-colors duration-200">Home</Link>
            <Link href="/about" className="text-gray-300 hover:text-ifuno-green transition-colors duration-200">About</Link>
            <Link href="/shop" className="text-gray-300 hover:text-ifuno-green transition-colors duration-200">Shop</Link>
            <Link href="/tech" className="text-gray-300 hover:text-ifuno-green transition-colors duration-200">Tech</Link>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">IFUNO • UK Releases</p>
          <h1 className="text-3xl sm:text-4xl font-black title-stroke mt-2">{displayTitle}</h1>
          {displayArtist && <p className="text-ifuno-green text-sm mt-1">{displayArtist}</p>}
          <p className="text-gray-400 text-xs mt-1">Published: {publishedDate}</p>
          {item.view_count && (
            <p className="text-gray-400 text-xs mt-1">Views: {item.view_count}</p>
          )}
        </div>

        <div className="bg-black/60 border border-ifuno-pink rounded-2xl overflow-hidden shadow-xl">
          <div className="aspect-video bg-black">
            <iframe
              src={item.embed_url || ''}
              title={`${displayArtist || 'Artist'} - ${displayTitle}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-6 space-y-3 text-sm text-gray-300">
            <p>{chosen}</p>
            <p className="text-gray-500 text-xs">
              Tags: UK rap, UK drill, underground, clean version, radio edit, instrumental, acapella, sped up, slowed down, official release, YouTube topic, Spotify, Apple Music, Amazon Music, GRM Daily, Mixtape Madness, Link Up TV, Press Play, new song, music.
            </p>
          </div>
        </div>

        {/* Visually hidden SEO tags */}
        <div className="sr-only">
          {[
            displayArtist,
            displayTitle,
            'instrumental',
            'type beat',
            'cover version',
            'acapella',
            'sped up',
            'slowed down',
            'speed up',
            'slow',
            'clean version',
            'radio edit',
            'spotify release',
            'official release',
            'net video',
            'youtube topic',
            'amazon music',
            'spotify',
            'apple music',
            'itunes',
            'uk rap',
            'uk drill',
            'uk underground',
            'ug underground music',
            'grm daily',
            'bouncer hub',
            'mixtape madness',
            'link up tv',
            'press play',
            'new song',
            'music',
          ]
            .filter(Boolean)
            .join(' ')}
        </div>
      </div>
    </div>
  );
}
