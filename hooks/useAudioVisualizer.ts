import React, { useEffect, useRef } from 'react';
import { FrequencyBand, VisualizationType } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface AudioVisualizerState {
  analyser: AnalyserNode | null;
  fileSource: MediaElementAudioSourceNode | null;
  animationFrameId: number | null;
  particles: Particle[];
  cachedAudioElement: HTMLAudioElement | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

interface VisualizerOptions {
    isPlaying: boolean;
    visualizationType: VisualizationType;
    isReady: boolean;
    audioContext: AudioContext | null;
    onShake: (shake: {x: number, y: number}) => void;
}

const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
};


export const useAudioVisualizer = (
  audioRef: React.RefObject<HTMLAudioElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: VisualizerOptions,
) => {
  const { isPlaying, visualizationType, isReady, audioContext, onShake } = options;
  const { currentPaletteColors, intensity, frequencyGains, crossoverFrequencies, bassShake } = useSettings();

  const visualizerState = useRef<AudioVisualizerState>({
    analyser: null,
    fileSource: null,
    animationFrameId: null,
    particles: [],
    cachedAudioElement: null,
  }).current;
  
  const lastHiddenTimestamp = useRef<number | null>(null);

  useEffect(() => {
    if (!audioContext || !audioRef.current) {
      return;
    }
    const audioEl = audioRef.current;

    if (!visualizerState.analyser) {
      visualizerState.analyser = audioContext.createAnalyser();
      visualizerState.analyser.fftSize = 2048;
    }
    const analyser = visualizerState.analyser;

    if (visualizerState.cachedAudioElement !== audioEl) {
      try {
        visualizerState.fileSource = audioContext.createMediaElementSource(audioEl);
        visualizerState.cachedAudioElement = audioEl;
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'InvalidStateError')) {
           console.error("Error creating file source:", e);
        }
      }
    }
    const fileSource = visualizerState.fileSource;

    fileSource?.disconnect();
    analyser.disconnect();

    if (fileSource && isReady) {
      fileSource.connect(analyser);
      analyser.connect(audioContext.destination);
    }
    
  }, [isReady, audioContext, audioRef]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
        let tempCanvas: HTMLCanvasElement | null = null;
        
        // Before resizing, if it's a spectrogram, save the current state
        if (visualizationType === VisualizationType.SPECTROGRAM && canvas.width > 0 && canvas.height > 0) {
            tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx?.drawImage(canvas, 0, 0);
        }

        const newWidth = canvas.clientWidth * window.devicePixelRatio;
        const newHeight = canvas.clientHeight * window.devicePixelRatio;

        // Only resize if dimensions have actually changed
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
            canvas.width = newWidth;
            canvas.height = newHeight;

            // After resizing, if we saved a state, draw it back scaled
            if (tempCanvas) {
                ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
            }
        }
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial call to set size

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [visualizationType]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (document.hidden) {
        lastHiddenTimestamp.current = performance.now();
      } else {
        if (lastHiddenTimestamp.current && visualizationType === VisualizationType.SPECTROGRAM) {
          const elapsedTime = performance.now() - lastHiddenTimestamp.current;
          const framesMissed = Math.round(elapsedTime / (1000 / 60));
          
          const ctx = canvas.getContext('2d');
          if (ctx && framesMissed > 0) {
            const width = canvas.width;
            const height = canvas.height;
            const pixelsToShift = Math.min(width, framesMissed);

            const imageData = ctx.getImageData(pixelsToShift, 0, width - pixelsToShift, height);
            ctx.clearRect(0, 0, width, height);
            ctx.putImageData(imageData, 0, 0);
          }
        }
        lastHiddenTimestamp.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [visualizationType, canvasRef]);

  const getGradientColor = (position: number, value: number) => {
    const colors = currentPaletteColors;
    const rgbColors = colors.map(hexToRgb).filter(c => c !== null) as [number, number, number][];
    if (rgbColors.length === 0) return 'rgba(255,255,255,0.9)';
    
    const scaledPosition = Math.max(0, Math.min(1, position)) * (rgbColors.length - 1);
    const idx1 = Math.floor(scaledPosition);
    const idx2 = Math.min(idx1 + 1, rgbColors.length - 1);
    const blend = scaledPosition - idx1;
    
    const c1 = rgbColors[idx1];
    const c2 = rgbColors[idx2];
    
    const r = c1[0] + (c2[0] - c1[0]) * blend;
    const g = c1[1] + (c2[1] - c1[1]) * blend;
    const b = c1[2] + (c2[2] - c1[2]) * blend;

    const r_norm = r / 255, g_norm = g / 255, b_norm = b / 255;
    const max = Math.max(r_norm, g_norm, b_norm), min = Math.min(r_norm, g_norm, b_norm);
    let h = 0, s = 0;
    const l_base = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l_base > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r_norm: h = (g_norm - b_norm) / d + (g_norm < b_norm ? 6 : 0); break;
            case g_norm: h = (b_norm - r_norm) / d + 2; break;
            case b_norm: h = (r_norm - g_norm) / d + 4; break;
        }
        h /= 6;
    }
    
    const hue = h * 360;
    const saturation = s * 100;
    const lightness = 30 + (value / 255) * 50; 
    
    return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.9)`;
  };
  
    const processFrequencyData = (
      inputArray: Uint8Array,
      analyserNode: AnalyserNode,
      audioCtx: AudioContext
    ): Uint8Array => {
      const processedData = new Uint8Array(inputArray.length);
      const frequencyPerBin = audioCtx.sampleRate / 2 / analyserNode.frequencyBinCount;
      
      for (let i = 0; i < analyserNode.frequencyBinCount; i++) {
        const freq = i * frequencyPerBin;
        let gain = 1.0;
        
        if (freq <= crossoverFrequencies.bassMid) {
          gain = frequencyGains[FrequencyBand.BASS];
        } else if (freq > crossoverFrequencies.bassMid && freq <= crossoverFrequencies.midTreble) {
          gain = frequencyGains[FrequencyBand.MIDS];
        } else {
          gain = frequencyGains[FrequencyBand.TREBLE];
        }

        processedData[i] = inputArray[i] * gain;
      }
      
      return processedData;
    };

  const drawBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const barWidth = (ctx.canvas.width / bufferLength) * 1.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] * (ctx.canvas.height / 255)) * intensity;
        ctx.fillStyle = getGradientColor(i / bufferLength, dataArray[i]);
        ctx.fillRect(x, ctx.canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
  };
  
  const drawWaveform = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.lineWidth = 1 + intensity * 6;
    
    const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
    currentPaletteColors.forEach((color, index) => {
        gradient.addColorStop(index / (currentPaletteColors.length -1 || 1), color);
    });
    ctx.strokeStyle = gradient;

    ctx.beginPath();
    const sliceWidth = ctx.canvas.width * 1.0 / bufferLength;
    let x = 0;
    const centerY = ctx.canvas.height / 2;

    for (let i = 0; i < bufferLength; i++) {
        const amplitude = (dataArray[i] - 128) / 128.0;
        const y = centerY + (amplitude * centerY * (0.5 + intensity));

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        x += sliceWidth;
    }
    ctx.lineTo(ctx.canvas.width, centerY);
    ctx.stroke();
  };

  const drawRadial = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.15;
    const maxBarLength = Math.min(centerX, centerY) * 0.8;
    
    const bars = Math.floor(bufferLength / 2);
    for (let i = 0; i < bars; i++) {
        const value = dataArray[i];
        const barHeight = ((value / 255) ** 2) * maxBarLength * (0.2 + intensity * 1.5);
        const angle = (i / bars) * 2 * Math.PI;

        ctx.strokeStyle = getGradientColor(i / bars, value);
        ctx.lineWidth = 2 + intensity * 5;
        ctx.lineCap = 'round';

        const x1 = centerX + Math.cos(angle) * (baseRadius + 2);
        const y1 = centerY + Math.sin(angle) * (baseRadius + 2);
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
  };
  
  const drawCircles = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY);

    for (let i = 0; i < bufferLength; i+=8) {
        const radius = ((dataArray[i] / 255) * maxRadius * 0.8) * intensity;
        ctx.strokeStyle = getGradientColor(i / bufferLength, dataArray[i]);
        ctx.lineWidth = 2 + (dataArray[i] / 255) * 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
  };
  
  const drawGrid = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const gridSize = 16;
    const stepX = ctx.canvas.width / gridSize;
    const stepY = ctx.canvas.height / gridSize;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const dataIndex = (i * gridSize + j) % bufferLength;
            const value = dataArray[dataIndex];
            const size = ((value / 255) * Math.min(stepX, stepY) * 0.9) * intensity;
            const x = i * stepX + (stepX - size) / 2;
            const y = j * stepY + (stepY - size) / 2;

            ctx.fillStyle = getGradientColor(dataIndex / bufferLength, value);
            ctx.fillRect(x, y, size, size);
        }
    }
  };

  const drawGalaxy = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    let bass = 0;
    const bassBins = 16;
    for (let i = 0; i < bassBins; i++) bass += dataArray[i];
    bass /= bassBins;
    
    const threshold = 80 - intensity * 20; 

    if (bass > threshold && visualizerState.particles.length < 500) {
        const colors = currentPaletteColors;
        const numToSpawn = 2 + Math.floor(intensity * 4);
        for(let i=0; i < numToSpawn; i++){
            const color = colors[Math.floor(Math.random() * colors.length)];
            visualizerState.particles.push({
                x: centerX, y: centerY,
                vx: (Math.random() - 0.5) * (bass/60) * intensity, 
                vy: (Math.random() - 0.5) * (bass/60) * intensity,
                radius: (Math.random() * 2 + 1) * intensity,
                alpha: 1,
                color: color
            });
        }
    }
    
    const livingParticles: Particle[] = [];
    visualizerState.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.01;

        if (p.alpha > 0) {
            livingParticles.push(p);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fill();
        }
    });

    ctx.globalAlpha = 1;
    visualizerState.particles = livingParticles;
  };

  const drawFlower = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.1;
    const maxPetalLength = Math.min(centerX, centerY) * 0.8;
    
    const segments = 64;
    for (let i = 0; i < segments; i++) {
        const value = dataArray[Math.floor(i * (bufferLength/segments))];
        const petalLength = ((value / 255) ** 2) * maxPetalLength * (0.5 + intensity);
        const angle = (i / segments) * 2 * Math.PI;

        ctx.strokeStyle = getGradientColor(i / segments, value);
        ctx.lineWidth = 1 + intensity * 3;
        ctx.lineCap = 'round';

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + petalLength);
        const y2 = centerY + Math.sin(angle) * (baseRadius + petalLength);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
  };

  const drawStrings = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const numStrings = 8 + Math.floor(intensity * 8);
    const stringHeight = ctx.canvas.height / numStrings;

    for (let i = 0; i < numStrings; i++) {
        const yOffset = stringHeight * (i + 0.5);
        
        ctx.strokeStyle = getGradientColor(i / numStrings, 150);
        ctx.lineWidth = 1 + intensity * 2;
        ctx.beginPath();
        
        const sliceWidth = ctx.canvas.width / bufferLength;
        let x = 0;

        for (let j = 0; j < bufferLength; j++) {
            const dataIdx = (j + Math.floor(bufferLength / numStrings * i)) % bufferLength;
            const v = dataArray[dataIdx] / 128.0;
            const y = yOffset + (v - 1) * stringHeight * 0.4 * intensity;

            if (j === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        ctx.stroke();
    }
  };

  const drawTunnel = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const steps = 16;

    for (let i = steps; i > 0; i--) {
        const dataIndex = Math.floor(bufferLength / 2 / steps * i);
        const value = dataArray[dataIndex];
        
        const scale = i / steps;
        const width = ctx.canvas.width * scale;
        const height = ctx.canvas.height * scale;
        const x = centerX - width / 2;
        const y = centerY - height / 2;

        const alpha = value / 255 * intensity;
        
        ctx.strokeStyle = getGradientColor(i / steps, value);
        ctx.lineWidth = 1 + (value/255) * 5 * intensity;
        ctx.globalAlpha = alpha;
        ctx.strokeRect(x, y, width, height);
        ctx.globalAlpha = 1;
    }
  };

  const drawSpectrogram = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    const imageData = ctx.getImageData(1, 0, width - 1, height);
    ctx.putImageData(imageData, 0, 0);

    const barHeight = height / bufferLength;
    for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const y = height - ((i + 1) * barHeight);
        
        const hue = (value / 255) * 300;
        const saturation = 90;
        const lightness = 15 + (value / 255) * 50;
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.9)`;
        
        ctx.fillRect(width - 1, y, 1, barHeight + 1);
    }
  };

  const drawParticleFlow = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const colors = currentPaletteColors;
    const energy = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;

    const numToSpawn = Math.floor((energy / 255) * 5 * intensity);
    for (let i = 0; i < numToSpawn; i++) {
        const midIndex = Math.floor(bufferLength / 4);
        const trebleIndex = Math.floor(bufferLength / 2);
        const midValue = dataArray[midIndex];
        const trebleValue = dataArray[trebleIndex];

        visualizerState.particles.push({
            x: 0,
            y: Math.random() * ctx.canvas.height,
            vx: 1 + (midValue / 255) * 4 * intensity,
            vy: (Math.random() - 0.5) * 2 + ((trebleValue / 255) - 0.5) * 3,
            radius: (Math.random() * 1.5 + 0.5) * intensity,
            alpha: 0.7 + Math.random() * 0.3,
            color: colors[Math.floor(Math.random() * colors.length)],
        });
    }

    const livingParticles: Particle[] = [];
    visualizerState.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.008;

        if (p.alpha > 0 && p.x < ctx.canvas.width) {
            livingParticles.push(p);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fill();
        }
    });

    ctx.globalAlpha = 1;
    visualizerState.particles = livingParticles.slice(0, 800);
  };

  const handleBassShake = (dataArray: Uint8Array) => {
    if (!bassShake) {
        onShake({ x: 0, y: 0 });
        return;
    }
    const bassBins = 8;
    let bass = 0;
    for (let i = 0; i < bassBins; i++) bass += dataArray[i];
    bass /= bassBins;

    if (bass > 190) {
        const shakeAmount = ((bass - 190) / 65) * 8 * intensity;
        const x = (Math.random() - 0.5) * shakeAmount;
        const y = (Math.random() - 0.5) * shakeAmount;
        onShake({ x, y });
    } else {
        onShake({ x: 0, y: 0 });
    }
  };

  const renderFrame = () => {
    const analyser = visualizerState.analyser;
    if (!analyser || !audioContext) {
        if (visualizerState.animationFrameId) {
            cancelAnimationFrame(visualizerState.animationFrameId);
            visualizerState.animationFrameId = null;
        }
        return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const isTimeDomain = [VisualizationType.WAVEFORM, VisualizationType.STRINGS].includes(visualizationType);
    if(isTimeDomain) {
      analyser.getByteTimeDomainData(dataArray);
    } else {
      analyser.getByteFrequencyData(dataArray);
    }

    const processedData = isTimeDomain ? dataArray : processFrequencyData(dataArray, analyser, audioContext);
    
    handleBassShake(processedData);

    if (visualizationType !== VisualizationType.SPECTROGRAM && visualizationType !== VisualizationType.GALAXY && visualizationType !== VisualizationType.PARTICLE_FLOW) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    if (visualizationType !== VisualizationType.GALAXY && visualizationType !== VisualizationType.PARTICLE_FLOW) {
        visualizerState.particles = [];
    }

    switch(visualizationType){
        case VisualizationType.WAVEFORM:
            drawWaveform(ctx, dataArray, bufferLength);
            break;
        case VisualizationType.RADIAL:
            drawRadial(ctx, processedData, bufferLength);
            break;
        case VisualizationType.GALAXY:
            drawGalaxy(ctx, processedData, bufferLength);
            break;
        case VisualizationType.CIRCLES:
            drawCircles(ctx, processedData, bufferLength);
            break;
        case VisualizationType.GRID:
            drawGrid(ctx, processedData, bufferLength);
            break;
        case VisualizationType.FLOWER:
            drawFlower(ctx, processedData, bufferLength);
            break;
        case VisualizationType.STRINGS:
            drawStrings(ctx, dataArray, bufferLength);
            break;
        case VisualizationType.TUNNEL:
            drawTunnel(ctx, processedData, bufferLength);
            break;
        case VisualizationType.SPECTROGRAM:
            drawSpectrogram(ctx, processedData, bufferLength);
            break;
        case VisualizationType.PARTICLE_FLOW:
            drawParticleFlow(ctx, processedData, bufferLength);
            break;
        case VisualizationType.BARS:
        default:
            drawBars(ctx, processedData, bufferLength);
            break;
    }
    
    visualizerState.animationFrameId = requestAnimationFrame(renderFrame);
  };


  useEffect(() => {
    if (isPlaying) {
      if (audioContext?.state === 'suspended') {
         audioContext.resume();
      }
      if (!visualizerState.animationFrameId) {
        renderFrame();
      }
    } else {
      if (visualizerState.animationFrameId) {
        cancelAnimationFrame(visualizerState.animationFrameId);
        visualizerState.animationFrameId = null;
      }
      onShake({ x: 0, y: 0 });
    }
    return () => {
      if (visualizerState.animationFrameId) {
        cancelAnimationFrame(visualizerState.animationFrameId);
        visualizerState.animationFrameId = null;
      }
    };
  }, [isPlaying, visualizationType, currentPaletteColors, intensity, audioContext, frequencyGains, crossoverFrequencies, bassShake]);

  // --- PATCH: Spectrogram background rendering when tab is hidden ---
  const intervalIdRef = useRef<number | null>(null);
  const isTabHiddenRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabHiddenRef.current = document.hidden;
      if (document.hidden) {
        // Стартуем setInterval для спектрограммы только если играет музыка
        if (
          visualizationType === VisualizationType.SPECTROGRAM &&
          intervalIdRef.current === null &&
          isPlaying
        ) {
          intervalIdRef.current = window.setInterval(() => {
            if (canvasRef.current && visualizerState.analyser && isPlaying) {
              const ctx = canvasRef.current.getContext('2d');
              if (!ctx) return;
              const bufferLength = visualizerState.analyser.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);
              visualizerState.analyser.getByteFrequencyData(dataArray);
              drawSpectrogram(ctx, dataArray, bufferLength);
              lastSpectroData.current = dataArray.slice();
            }
          }, 1000 / 60); // 60 FPS
        }
      } else {
        // Останавливаем setInterval
        if (intervalIdRef.current !== null) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
        // --- PATCH: Заполняем пропущенные столбцы только если играла музыка ---
        if (
          visualizationType === VisualizationType.SPECTROGRAM &&
          canvasRef.current && visualizerState.analyser &&
          isPlaying &&
          lastHiddenTimestamp.current
        ) {
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;
          const bufferLength = visualizerState.analyser.frequencyBinCount;
          const framesMissed = Math.round((performance.now() - lastHiddenTimestamp.current) / (1000 / 60));
          const dataArray = lastSpectroData.current || new Uint8Array(bufferLength);
          for (let i = 0; i < framesMissed; i++) {
            drawSpectrogram(ctx, dataArray, bufferLength);
          }
        }
        // --- END PATCH ---
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    handleVisibilityChange();
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [visualizationType, canvasRef, visualizerState, isPlaying]);

  // Для хранения последних данных спектра
  const lastSpectroData = useRef<Uint8Array | null>(null);
  // --- END PATCH ---
};