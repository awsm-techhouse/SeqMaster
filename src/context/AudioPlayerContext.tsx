'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AudioContextType {
  activeTrackId: string | null;
  isPlaying: boolean;
  triggerPlayback: (trackId: string, streamUrl: string) => void;
  terminatePlayback: () => void;
}

const AudioPlayerContext = createContext<AudioContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    setAudioElement(audio);
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const triggerPlayback = (trackId: string, streamUrl: string) => {
    if (!audioElement) return;

    if (activeTrackId === trackId) {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      audioElement.pause();
      audioElement.src = streamUrl;
      audioElement.load();
      audioElement.play().catch(() => {});
      setActiveTrackId(trackId);
      setIsPlaying(true);
    }
  };

  const terminatePlayback = () => {
    if (audioElement) audioElement.pause();
    setIsPlaying(false);
    setActiveTrackId(null);
  };

  return (
    <AudioPlayerContext.Provider value={{ activeTrackId, isPlaying, triggerPlayback, terminatePlayback }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioSystem() {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error('useAudioSystem must be invoked within an AudioPlayerProvider wrapper.');
  return context;
}