'use client';

import { useEffect, useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { clearStoredSession, getStoredSession, setStoredSession } from '@/lib/ifuno-session';

export function LoginWithSpotifyButton() {
  const [session, setSession] = useState(getStoredSession());

  useEffect(() => {
    setSession(getStoredSession());
  }, []);

  const handleLogin = () => {
    const fakeUser = {
      spotifyUserId: 'demo-user',
      email: 'listener@ifuno.uk',
    };
    setStoredSession(fakeUser);
    setSession(fakeUser);
  };

  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
  };

  if (session) {
    return (
      <button
        onClick={handleLogout}
        className="inline-flex items-center space-x-2 rounded-md bg-black border border-ifuno-pink px-3 py-2 text-sm font-medium text-white hover:bg-ifuno-pink hover:text-black transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Connected: {session.email || session.spotifyUserId}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="inline-flex items-center space-x-2 rounded-md bg-ifuno-green px-3 py-2 text-sm font-semibold text-black hover:bg-ifuno-pink hover:text-white transition-colors"
    >
      <LogIn className="w-4 h-4" />
      <span>Log in with Spotify</span>
    </button>
  );
}
