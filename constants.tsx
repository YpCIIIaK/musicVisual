import React from 'react';
import { ColorPalette } from './types';

export const PlayIcon = ({ className }: { className?: string }): React.ReactNode => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const PauseIcon = ({ className }: { className?: string }): React.ReactNode => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

export const UploadIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

export const VolumeUpIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
    </svg>
);

export const VolumeMuteIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path>
    </svg>
);

export const SettingsIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
    </svg>
);

export const GlobeIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.5l.053.053a.5.5 0 010 .707l-.053.053L6.053 7.053a.5.5 0 01-.707 0l-.053-.053L4.5 6.293a.5.5 0 010-.707l.053-.053L5.293 4.5a.5.5 0 01.707 0zM12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
);

export const NextIcon = ({ className }: { className?: string }): React.ReactNode => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);

export const PreviousIcon = ({ className }: { className?: string }): React.ReactNode => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </svg>
);

export const FullscreenEnterIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
);

export const FullscreenExitIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
);

export const SparklesIcon = ({ className }: { className?: string }): React.ReactNode => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.35 6.35L21 9.6l-5.65 4.15L16.7 21 12 17.3 7.3 21l1.35-7.25L3 9.6l6.65-1.25L12 2zM6.5 2.5l-1 3-3-1 2 2.5-2 2.5 3-1 1 3 1-3 3 1-2-2.5 2-2.5-3 1-1-3zM17.5 18.5l-1 3-3-1 2 2.5-2 2.5 3-1 1 3 1-3 3 1-2-2.5 2-2.5-3 1-1-3z"/>
  </svg>
);


type PaletteCollection = {
    [key in ColorPalette]?: string[];
};

export const PALETTES: PaletteCollection = {
    [ColorPalette.VIBRANT]: ['#ff3f8f', '#ffb43f', '#3fffa2', '#3fcbff', '#9c3fff'],
    [ColorPalette.OCEAN]: ['#005f73', '#0a9396', '#94d2bd', '#e9d8a6', '#ee9b00'],
    [ColorPalette.FOREST]: ['#4f772d', '#90a955', '#ecf39e', '#73a942', '#31572c'],
    [ColorPalette.SUNSET]: ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#073b4c'],
    [ColorPalette.NEON]: ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'],
};