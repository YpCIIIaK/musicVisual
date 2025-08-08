import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { VisualizationType } from './types';
import { Controls } from './components/Controls';
import { Visualizer } from './components/Visualizer';
import { SettingsPanel } from './components/SettingsPanel';
import { useSettings } from './contexts/SettingsContext';
import { useTranslation } from './lib/i18n';

const App: React.FC = () => {
  const [playlist, setPlaylist] = useState<File[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoplayScheduled, setAutoplayScheduled] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [shake, setShake] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const { visualization, setVisualization, volume } = useSettings();
  const { t } = useTranslation();
  
  const initAudioContext = useCallback(async () => {
    let context = audioContext;
    if (!context) {
        try {
            context = new (window.AudioContext || (window as any).webkitAudioContext)();
            setAudioContext(context);
        } catch (e) {
            console.error("AudioContext not supported", e);
            alert("Your browser does not support the Web Audio API.");
            return;
        }
    }
    
    if (context.state === 'suspended') {
        try {
            await context.resume();
        } catch(e) {
            console.error("Failed to resume AudioContext", e);
        }
    }
  }, [audioContext]);


  const audioUrl = useMemo(() => {
    if (playlist.length > 0) {
      return URL.createObjectURL(playlist[currentTrackIndex]);
    }
    return null;
  }, [playlist, currentTrackIndex]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await initAudioContext();
    const files = event.target.files;
    if (files && files.length > 0) {
      setPlaylist(Array.from(files));
      setCurrentTrackIndex(0);
      setIsPlaying(false);
      setAutoplayScheduled(true);
    }
  };

  const handlePlayPause = async () => {
    await initAudioContext();
    if (playlist.length > 0) {
        setIsPlaying(!isPlaying);
    }
  };
  
  const handleEnded = () => {
    if (playlist.length > 1) {
        setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % playlist.length);
        setIsPlaying(false);
        setAutoplayScheduled(true);
    } else {
        setIsPlaying(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        setIsFullscreen(true);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }
  };

  const toggleLoop = () => {
    setIsLooping(prev => !prev);
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  
  const handleReady = useCallback(() => {
    if (isAutoplayScheduled) {
      setIsPlaying(true);
      setAutoplayScheduled(false);
    }
  }, [isAutoplayScheduled]);

  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;
    const update = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('loadedmetadata', update);
    return () => {
      audio.removeEventListener('timeupdate', update);
      audio.removeEventListener('loadedmetadata', update);
    };
  }, [audioElementRef]);
  const handleSeek = (time: number) => {
    const audio = audioElementRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  const currentTrackName = playlist.length > 0 ? playlist[currentTrackIndex].name : t('no_track');

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900/50 text-white font-sans overflow-hidden">
      <header className="absolute top-0 left-0 p-4 z-20 flex items-center justify-between w-full">
        <h1 className="text-2xl font-bold tracking-wider text-white/90">{t('title')}</h1>
        <div className="text-right">
            <p className="text-white/80 bg-black/20 px-3 py-1 rounded-md text-sm truncate max-w-xs sm:max-w-sm" title={currentTrackName}>
              {currentTrackName}
            </p>
        </div>
      </header>
      
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <main className="flex-grow flex items-center justify-center relative">
        <div 
            className="absolute inset-0 w-full h-full transition-transform duration-75"
            style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}
        >
            <Visualizer 
                ref={audioElementRef}
                audioUrl={audioUrl} 
                isPlaying={isPlaying} 
                visualizationType={visualization}
                volume={volume}
                onEnded={handleEnded}
                onReady={handleReady}
                isLooping={isLooping}
                audioContext={audioContext}
                onShake={setShake}
            />
        </div>
        {playlist.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="text-center p-8 bg-black/30 backdrop-blur-sm rounded-xl">
                    <h2 className="text-3xl font-semibold text-white/90">{t('welcome_title')}</h2>
                    <p className="mt-2 text-lg text-white/70">{t('welcome_subtitle')}</p>
                </div>
            </div>
        )}
      </main>

      <footer className="w-full p-4 z-20 bg-black/20 backdrop-blur-md">
        <Controls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onFileChange={handleFileChange}
          isAudioLoaded={playlist.length > 0}
          isLooping={isLooping}
          onToggleLoop={toggleLoop}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
        />
      </footer>
    </div>
  );
};

export default App;