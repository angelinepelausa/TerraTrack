// context/AudioContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import audioService from '../services/audioService';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [isAudioReady, setIsAudioReady] = useState(false);

  useEffect(() => {
    // Preload background music when app starts
    const preloadAudio = async () => {
      try {
        await audioService.loadBackgroundMusic();
        setIsAudioReady(true);
        console.log('Background music loaded successfully');
      } catch (error) {
        console.log('Audio preloading failed:', error);
        setIsAudioReady(true); // Continue anyway
      }
    };

    preloadAudio();

    // Cleanup on unmount
    return () => {
      audioService.cleanup();
    };
  }, []);

  const playBackgroundMusic = (fadeDuration = 15000) => {
    audioService.playBackgroundMusicWithFade(fadeDuration);
  };

  const stopBackgroundMusic = (fadeDuration = 5000) => {
    return audioService.stopBackgroundMusicWithFade(fadeDuration);
  };

  const pauseBackgroundMusic = () => {
    audioService.pauseBackgroundMusic();
  };

  const resumeBackgroundMusic = () => {
    audioService.resumeBackgroundMusic();
  };

  const setBackgroundMusicVolume = (volume) => {
    audioService.setBackgroundMusicVolume(volume);
  };

  const value = {
    isAudioReady,
    playBackgroundMusic,
    stopBackgroundMusic,
    pauseBackgroundMusic,
    resumeBackgroundMusic,
    setBackgroundMusicVolume,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};