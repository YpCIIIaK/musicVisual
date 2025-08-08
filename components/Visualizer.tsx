import React, { useRef, useImperativeHandle, forwardRef } from 'react';
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
  onShake: (shake: {x: number, y: number}) => void;
}

export const Visualizer = forwardRef<HTMLAudioElement, VisualizerProps>(
  ({ audioUrl, isPlaying, visualizationType, volume, onEnded, onReady, isLooping, audioContext, onShake }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { playbackRate } = useSettings();
    const [isReady, setIsReady] = useState(false);

    useAudioVisualizer(audioRef, canvasRef, {
        isPlaying,
        visualizationType,
        isReady,
        audioContext,
        onShake,
    });
    
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

    useEffect(() => {
      const audioElement = audioRef.current;
      if (audioElement) {
          audioElement.volume = volume;
      }
    }, [volume]);
    
    useEffect(() => {
      const audioElement = audioRef.current;
      if (audioElement) {
          audioElement.playbackRate = playbackRate;
      }
    }, [playbackRate]);

    useEffect(() => {
      const audioElement = audioRef.current;
      if (audioElement) {
        audioElement.loop = isLooping;
      }
    }, [isLooping]);
    
    useImperativeHandle(ref, () => audioRef.current as HTMLAudioElement, []);

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
  }
);