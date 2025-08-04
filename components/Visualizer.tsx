import React, { useRef, useEffect, useState } from 'react';
import { VisualizationType } from '../types';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import { useSettings } from '../contexts/SettingsContext';

interface VisualizerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  visualizationType: VisualizationType;
  volume: number;
  onEnded: () => void;
  onReady: () => void;
  isLooping: boolean;
  audioContext: AudioContext | null;
}

export const Visualizer: React.FC<VisualizerProps> = ({ audioUrl, isPlaying, visualizationType, volume, onEnded, onReady, isLooping, audioContext }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { playbackRate } = useSettings();
  const [isReady, setIsReady] = useState(false);

  useAudioVisualizer(audioRef, canvasRef, {
      isPlaying,
      visualizationType,
      isReady,
      audioContext,
  });
  
  // Effect for controlling audio playback (play/pause)
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const playAudio = async () => {
      try {
        await audioElement.play();
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          console.error("Audio play failed:", error);
        }
      }
    };

    if (isPlaying && isReady) {
      playAudio();
    } else {
      audioElement.pause();
    }
  }, [isPlaying, isReady]);

  // Effect for handling audio source changes
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (audioUrl && audioElement.src !== audioUrl) {
      setIsReady(false);
      audioElement.src = audioUrl;
      audioElement.load();
    } else if (!audioUrl) {
      setIsReady(false);
      audioElement.src = "";
    }
  }, [audioUrl]);

  // Effect for controlling volume
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
        audioElement.volume = volume;
    }
  }, [volume]);
  
  // Effect for controlling playback rate
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
        audioElement.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Effect for controlling looping
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.loop = isLooping;
    }
  }, [isLooping]);
  
  const handleCanPlay = () => {
    setIsReady(true);
    onReady();
  };


  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
      <audio 
        ref={audioRef} 
        onEnded={onEnded} 
        crossOrigin="anonymous" 
        onCanPlay={handleCanPlay}
      />
    </div>
  );
};