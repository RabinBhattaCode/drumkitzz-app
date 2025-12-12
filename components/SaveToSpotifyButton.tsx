'use client';

import { useEffect, useState } from 'react';
import { Heart, Loader2, Music2 } from 'lucide-react';
import { getStoredSession } from '@/lib/ifuno-session';

type Props = {
  spotifyTrackId: string;
};

export function SaveToSpotifyButton({ spotifyTrackId }: Props) {
  const [session, setSession] = useState(getStoredSession());
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setSession(getStoredSession());
  }, []);

  const handleSave = async () => {
    if (!session) {
      window.alert('Log in with Spotify first.');
      return;
    }
    try {
      setStatus('saving');
      // Placeholder call; replace with real API call when backend is wired.
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  if (!session) {
    return (
      <button
        onClick={() => window.alert('Connect Spotify to save tracks.')}
        className="inline-flex items-center space-x-2 rounded-md border border-ifuno-pink px-3 py-2 text-sm font-semibold text-white hover:bg-ifuno-pink hover:text-black transition-colors"
      >
        <Music2 className="w-4 h-4" />
        <span>Log in to save</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={status === 'saving'}
      className="inline-flex items-center space-x-2 rounded-md bg-ifuno-green px-3 py-2 text-sm font-semibold text-black hover:bg-ifuno-pink hover:text-white transition-colors disabled:opacity-60"
    >
      {status === 'saving' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : status === 'saved' ? (
        <Heart className="w-4 h-4 fill-current" />
      ) : (
        <Music2 className="w-4 h-4" />
      )}
      <span>
        {status === 'saving'
          ? 'Saving...'
          : status === 'saved'
          ? 'Saved'
          : status === 'error'
          ? 'Error'
          : 'Save to Spotify'}
      </span>
    </button>
  );
}
