import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../lib/i18n';
import { Language, VisualizationType, ColorPalette, FrequencyBand } from '../types';
import { GlobeIcon, SparklesIcon } from '../constants';
import { GoogleGenAI, Type } from '@google/genai';


interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsButtonProps {
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    disabled?: boolean;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick, isActive, children, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed ${
            isActive
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-700/80 hover:bg-gray-600/80'
        }`}
    >
        {children}
    </button>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const {
    language, setLanguage,
    visualization, setVisualization,
    palette, setPalette,
    intensity, setIntensity,
    playbackRate, setPlaybackRate,
    aiPalette, setAiPalette,
    currentPaletteColors,
    frequencyGains, setFrequencyGains,
    crossoverFrequencies, setCrossoverFrequencies,
  } = useSettings();
  const { t } = useTranslation();
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const handleGainChange = (band: FrequencyBand, value: number) => {
    setFrequencyGains(prev => ({ ...prev, [band]: value }));
  };

  const handleCrossoverChange = (type: 'bassMid' | 'midTreble', value: number) => {
    if (type === 'bassMid' && value >= crossoverFrequencies.midTreble) {
        value = crossoverFrequencies.midTreble - 100;
    }
    if (type === 'midTreble' && value <= crossoverFrequencies.bassMid) {
        value = crossoverFrequencies.bassMid + 100;
    }
    setCrossoverFrequencies(prev => ({...prev, [type]: value}));
  };

  const handleGeneratePalette = async () => {
    if (!aiPrompt || isGenerating) return;
    setIsGenerating(true);
    setGenerationError('');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a cohesive and aesthetically pleasing color palette of exactly 5 colors based on this theme: "${aiPrompt}". The colors should work well together for an audio visualizer. Provide them as hex codes.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        colors: {
                            type: Type.ARRAY,
                            description: 'An array of 5 hex color code strings.',
                            items: {
                                type: Type.STRING,
                                description: "A hex color code string, e.g., '#RRGGBB'",
                            }
                        }
                    },
                    required: ['colors']
                },
            }
        });

        // The response text is a JSON string, so we need to parse it.
        const jsonResponse = JSON.parse(response.text);

        const colors = jsonResponse.colors;
        if (colors && Array.isArray(colors) && colors.length > 0) {
            setAiPalette(colors.slice(0, 5)); // Ensure only 5 colors
            setPalette(ColorPalette.AI);
        } else {
            throw new Error("Invalid response format from AI.");
        }
    } catch (error) {
        console.error("Error generating palette:", error);
        setGenerationError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
        setIsGenerating(false);
    }
  };

  const getGainLabelKey = (band: FrequencyBand): 'bass_gain' | 'mids_gain' | 'treble_gain' => {
    switch (band) {
      case FrequencyBand.BASS: return 'bass_gain';
      case FrequencyBand.MIDS: return 'mids_gain';
      case FrequencyBand.TREBLE: return 'treble_gain';
    }
  };


  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
        onClick={onClose}
    >
      <div 
        className="relative bg-gray-800 text-white rounded-2xl shadow-2xl p-6 w-full max-w-lg m-4 space-y-6 transform transition-all animate-fade-in-up overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{t('settings_title')}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors text-2xl leading-none">&times;</button>
        </div>

        {/* Visualization Type */}
        <div>
            <h3 className="text-lg font-semibold mb-2">{t('visualization_type')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.values(VisualizationType) as VisualizationType[]).map(visType => (
                    <SettingsButton key={visType} onClick={() => setVisualization(visType)} isActive={visualization === visType}>
                        {t(visType)}
                    </SettingsButton>
                ))}
            </div>
        </div>

        {/* Color Palette */}
        <div>
            <h3 className="text-lg font-semibold mb-2">{t('color_palette')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(ColorPalette) as (keyof typeof ColorPalette)[]).map(key => (
                    <SettingsButton key={key} onClick={() => setPalette(ColorPalette[key])} isActive={palette === ColorPalette[key]} disabled={ColorPalette[key] === ColorPalette.AI && aiPalette.length === 0}>
                        {t(ColorPalette[key])}
                    </SettingsButton>
                ))}
            </div>
             {palette === ColorPalette.AI && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-gray-700/50 rounded-md">
                    {currentPaletteColors.map((color, index) => (
                        <div key={index} className="w-full h-6 rounded" style={{ backgroundColor: color }} title={color}/>
                    ))}
                </div>
            )}
        </div>

        {/* AI Palette Generator */}
        <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-2">
                <SparklesIcon className="w-5 h-5 text-blue-400"/>
                {t('ai_palette_title')}
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={t('ai_palette_prompt')}
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleGeneratePalette()}
                />
                <button
                    onClick={handleGeneratePalette}
                    disabled={isGenerating || !aiPrompt}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md transition-all duration-200 disabled:bg-gray-500 disabled:cursor-wait"
                >
                    {isGenerating ? t('ai_generating') : t('ai_generate')}
                </button>
            </div>
            {generationError && <p className="text-red-400 text-sm mt-2">{generationError}</p>}
        </div>
        
        {/* Visualization Equalizer */}
        <div>
            <h3 className="text-lg font-semibold mb-3">{t('visualization_equalizer')}</h3>
            <div className="space-y-4">
                {(Object.values(FrequencyBand) as FrequencyBand[]).map(band => (
                    <div key={band}>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor={`${band}-gain`} className="text-sm font-medium text-gray-300 capitalize">{t(getGainLabelKey(band))}</label>
                            <span className="font-mono text-sm w-16 text-center bg-gray-700 py-1 rounded-md">{Math.round(frequencyGains[band] * 100)}%</span>
                        </div>
                        <input
                            id={`${band}-gain`}
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={frequencyGains[band]}
                            onChange={(e) => handleGainChange(band, parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            aria-label={`${band} gain`}
                        />
                    </div>
                ))}
            </div>
            <div className="mt-5 space-y-4 pt-4 border-t border-gray-700/60">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="bass-mid-crossover" className="text-sm font-medium text-gray-300">{t('bass_mid_crossover')}</label>
                        <span className="font-mono text-sm w-20 text-center bg-gray-700 py-1 rounded-md">{crossoverFrequencies.bassMid} Hz</span>
                    </div>
                    <input
                        id="bass-mid-crossover"
                        type="range"
                        min="100"
                        max="800"
                        step="10"
                        value={crossoverFrequencies.bassMid}
                        onChange={(e) => handleCrossoverChange('bassMid', parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        aria-label={t('bass_mid_crossover')}
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="mid-treble-crossover" className="text-sm font-medium text-gray-300">{t('mid_treble_crossover')}</label>
                        <span className="font-mono text-sm w-20 text-center bg-gray-700 py-1 rounded-md">{crossoverFrequencies.midTreble} Hz</span>
                    </div>
                    <input
                        id="mid-treble-crossover"
                        type="range"
                        min="1500"
                        max="8000"
                        step="100"
                        value={crossoverFrequencies.midTreble}
                        onChange={(e) => handleCrossoverChange('midTreble', parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        aria-label={t('mid_treble_crossover')}
                    />
                </div>
            </div>
        </div>


        {/* Intensity */}
        <div>
            <h3 className="text-lg font-semibold mb-2">{t('intensity')}</h3>
            <p className="text-sm text-gray-400 mb-3 -mt-2">{t('intensity_description')}</p>
            <div className="flex items-center gap-4">
                <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.1"
                    value={intensity}
                    onChange={(e) => setIntensity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    aria-label={t('intensity')}
                />
                <span className="font-mono text-sm w-12 text-center bg-gray-700 py-1 rounded-md">{intensity.toFixed(1)}</span>
            </div>
        </div>
        
        {/* Playback Speed */}
        <div>
            <h3 className="text-lg font-semibold mb-2">{t('playback_speed')}</h3>
            <p className="text-sm text-gray-400 mb-3 -mt-2">{t('playback_speed_description')}</p>
            <div className="flex items-center gap-4">
                <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    aria-label={t('playback_speed')}
                />
                <span className="font-mono text-sm w-12 text-center bg-gray-700 py-1 rounded-md">{playbackRate.toFixed(1)}x</span>
            </div>
        </div>

        {/* Language */}
        <div>
            <h3 className="text-lg font-semibold mb-2">{t('language')}</h3>
            <div className="flex gap-2">
                <SettingsButton onClick={() => setLanguage(Language.RU)} isActive={language === Language.RU}>
                    <span className="flex items-center justify-center gap-2"><GlobeIcon className="w-5 h-5"/>{t('russian')}</span>
                </SettingsButton>
                <SettingsButton onClick={() => setLanguage(Language.EN)} isActive={language === Language.EN}>
                     <span className="flex items-center justify-center gap-2"><GlobeIcon className="w-5 h-5"/>{t('english')}</span>
                </SettingsButton>
            </div>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }
    `}</style>
    </div>
  );
};