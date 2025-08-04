import React, { useRef } from 'react';
import { PlayIcon, PauseIcon, UploadIcon, VolumeUpIcon, VolumeMuteIcon, SettingsIcon, NextIcon, PreviousIcon, FullscreenEnterIcon, FullscreenExitIcon, LoopIcon } from '../constants';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../lib/i18n';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onPrev: () => void;
  isAudioLoaded: boolean;
  isLooping: boolean;
  onToggleLoop: () => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

const ControlButton: React.FC<{onClick?: () => void; title: string; children: React.ReactNode; disabled?: boolean; isActive?: boolean;}> = ({ onClick, title, children, disabled, isActive }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${isActive ? 'bg-blue-600 text-white' : ''}`}
    >
        {children}
    </button>
);

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayPause,
  onFileChange,
  onNext,
  onPrev,
  isAudioLoaded,
  isLooping,
  onToggleLoop,
  onOpenSettings,
  onToggleFullscreen,
  isFullscreen
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { volume, setVolume } = useSettings();
  const { t } = useTranslation();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center justify-between max-w-5xl mx-auto w-full gap-2 sm:gap-4">
      {/* Left Controls */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <button
          onClick={handleUploadClick}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
          title={t('upload_tooltip')}
        >
          <UploadIcon className="w-5 h-5" />
          <span className="hidden md:inline">{t('upload')}</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="audio/*"
          className="hidden"
          multiple
        />
        <div className="flex items-center gap-2 group">
            {volume > 0 ? <VolumeUpIcon className="w-6 h-6 text-gray-300" /> : <VolumeMuteIcon className="w-6 h-6 text-gray-300" />}
            <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 sm:w-24 accent-blue-500"
                aria-label={t('volume_label')}
            />
        </div>
      </div>

      {/* Center Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        <ControlButton onClick={onPrev} title={t('prev_track')} disabled={!isAudioLoaded}>
          <PreviousIcon className="w-6 h-6"/>
        </ControlButton>

        <button
          onClick={onPlayPause}
          disabled={!isAudioLoaded}
          className="w-14 h-14 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 disabled:scale-100"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
        </button>

        <ControlButton onClick={onNext} title={t('next_track')} disabled={!isAudioLoaded}>
          <NextIcon className="w-6 h-6"/>
        </ControlButton>
      </div>


      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
        <ControlButton onClick={onToggleLoop} title={t('loop_track')} disabled={!isAudioLoaded} isActive={isLooping}>
            <LoopIcon className="w-6 h-6"/>
        </ControlButton>
        <ControlButton onClick={onToggleFullscreen} title={isFullscreen ? t('fullscreen_exit') : t('fullscreen_enter')}>
            {isFullscreen ? <FullscreenExitIcon className="w-6 h-6"/> : <FullscreenEnterIcon className="w-6 h-6"/>}
        </ControlButton>
        <ControlButton onClick={onOpenSettings} title={t('settings_tooltip')}>
            <SettingsIcon className="w-6 h-6 text-white"/>
        </ControlButton>
      </div>
    </div>
  );
};