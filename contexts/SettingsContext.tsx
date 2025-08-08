import React, { createContext, useState, useContext, useMemo } from 'react';
import { Language, VisualizationType, ColorPalette, FrequencyBand } from '../types';
import { PALETTES } from '../constants';

interface SettingsContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  volume: number;
  setVolume: (volume: number) => void;
  visualization: VisualizationType;
  setVisualization: (type: VisualizationType) => void;
  palette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
  aiPalette: string[];
  setAiPalette: (palette: string[]) => void;
  intensity: number;
  setIntensity: (intensity: number) => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  bassShake: boolean;
  setBassShake: (enabled: boolean) => void;
  currentPaletteColors: string[];
  frequencyGains: Record<FrequencyBand, number>;
  setFrequencyGains: React.Dispatch<React.SetStateAction<Record<FrequencyBand, number>>>;
  crossoverFrequencies: { bassMid: number; midTreble: number; };
  setCrossoverFrequencies: React.Dispatch<React.SetStateAction<{ bassMid: number; midTreble: number; }>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [volume, setVolume] = useState<number>(0.75);
  const [visualization, setVisualization] = useState<VisualizationType>(VisualizationType.BARS);
  const [palette, setPalette] = useState<ColorPalette>(ColorPalette.VIBRANT);
  const [aiPalette, setAiPalette] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<number>(1.0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [bassShake, setBassShake] = useState<boolean>(false);
  const [frequencyGains, setFrequencyGains] = useState<Record<FrequencyBand, number>>({
    [FrequencyBand.BASS]: 1,
    [FrequencyBand.MIDS]: 1,
    [FrequencyBand.TREBLE]: 1,
  });
  const [crossoverFrequencies, setCrossoverFrequencies] = useState({
      bassMid: 250,
      midTreble: 4000,
  });


  const currentPaletteColors = useMemo(() => {
    if (palette === ColorPalette.AI && aiPalette.length > 0) {
      return aiPalette;
    }
    return PALETTES[palette] || PALETTES[ColorPalette.VIBRANT]!;
  }, [palette, aiPalette]);

  const value = useMemo(() => ({
    language, setLanguage,
    volume, setVolume,
    visualization, setVisualization,
    palette, setPalette,
    aiPalette, setAiPalette,
    intensity, setIntensity,
    playbackRate, setPlaybackRate,
    bassShake, setBassShake,
    currentPaletteColors,
    frequencyGains, setFrequencyGains,
    crossoverFrequencies, setCrossoverFrequencies,
  }), [language, volume, visualization, palette, aiPalette, intensity, playbackRate, bassShake, currentPaletteColors, frequencyGains, crossoverFrequencies]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};