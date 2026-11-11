import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Download, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Layers, 
  Sliders, 
  Maximize2, 
  RefreshCw, 
  Palette, 
  Eye, 
  Check, 
  Copy,
  Zap,
  Flame,
  ArrowLeft,
  Home,
  FileText
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { downloadMandalaReportWord, downloadMandalaReportPDF } from '../utils/moduleReportsExport';
import { PageNavBar } from './PageNavBar';

export type SacredPatternType = 
  | 'flower_of_life' 
  | 'sri_yantra' 
  | 'metatrons_cube' 
  | 'torus_field' 
  | 'golden_spiral' 
  | 'sahasrara_lotus' 
  | 'chakra_harmonic';

export type MandalaPalette = 
  | 'aura_gold' 
  | 'emerald_healer' 
  | 'violet_crown' 
  | 'cosmic_nebula' 
  | 'rainbow_chakra' 
  | 'mystic_cyan';

interface MandalaGeneratorProps {
  initialFrequency?: number;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export const MandalaGenerator: React.FC<MandalaGeneratorProps> = ({
  initialFrequency = 528,
  onGoBack,
  onGoHome,
}) => {
  const [patternType, setPatternType] = useState<SacredPatternType>('flower_of_life');
  const [frequencyHz, setFrequencyHz] = useState<number>(initialFrequency);
  const [binauralHz, setBinauralHz] = useState<number>(7.83);
  const [palette, setPalette] = useState<MandalaPalette>('aura_gold');
  
  // Mathematical Parameters
  const [layers, setLayers] = useState<number>(5);
  const [petals, setPetals] = useState<number>(12);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.6);
  const [glowIntensity, setGlowIntensity] = useState<number>(18);
  const [lineWidth, setLineWidth] = useState<number>(1.8);
  const [pulseSpeed, setPulseSpeed] = useState<number>(0.8);
  const [isAudioReactive, setIsAudioReactive] = useState<boolean>(true);
  const [isPlayingSound, setIsPlayingSound] = useState<boolean>(false);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  // Solfeggio frequencies list
  const FREQUENCIES = [
    { hz: 396, name: '396 Hz - Kök & Korkulardan Kurtuluş', color: '#ef4444' },
    { hz: 417, name: '417 Hz - Sakral & Değişim & Blokaj Çözümü', color: '#f97316' },
    { hz: 432, name: '432 Hz - Evrensel Barış & Biyolojik Ahenk', color: '#eab308' },
    { hz: 528, name: '528 Hz - Kalp & DNA Onarımı & Sevgi Mucizesi', color: '#10b981' },
    { hz: 639, name: '639 Hz - Boğaz & İlişkiler & Kalbi İletişim', color: '#06b6d4' },
    { hz: 741, name: '741 Hz - 3. Göz & Sezgi & Toksin Arınması', color: '#3b82f6' },
    { hz: 852, name: '852 Hz - Tepe & Manevi Uyanış & Berraklık', color: '#8b5cf6' },
    { hz: 963, name: '963 Hz - Taç & Saf İlahi Bilinç & Birlik', color: '#d946ef' },
  ];

  const PALETTES_CONFIG: Record<MandalaPalette, { name: string; colors: string[]; glow: string }> = {
    aura_gold: {
      name: 'Altın Rezonans & Güneş',
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#ffffff'],
      glow: 'rgba(251, 191, 36, 0.65)',
    },
    emerald_healer: {
      name: 'Zümrüt Şifa & Prana',
      colors: ['#34d399', '#10b981', '#059669', '#a7f3d0', '#6ee7b7'],
      glow: 'rgba(16, 185, 129, 0.65)',
    },
    violet_crown: {
      name: 'Taç Nur & Ametist',
      colors: ['#c084fc', '#a855f7', '#7e22ce', '#e9d5ff', '#f3e8ff'],
      glow: 'rgba(168, 85, 247, 0.65)',
    },
    cosmic_nebula: {
      name: 'Kozmik Galaksi & Yıldız',
      colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4', '#f43f5e'],
      glow: 'rgba(139, 92, 246, 0.65)',
    },
    rainbow_chakra: {
      name: '7 Çakra Gökkuşağı',
      colors: ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#a855f7'],
      glow: 'rgba(6, 182, 212, 0.65)',
    },
    mystic_cyan: {
      name: 'Turkuaz & Kuantum Eter',
      colors: ['#22d3ee', '#06b6d4', '#0891b2', '#cffafe', '#e0f2fe'],
      glow: 'rgba(34, 211, 238, 0.65)',
    },
  };

  const handleToggleSound = () => {
    if (isPlayingSound) {
      soundEngine.stop();
      setIsPlayingSound(false);
    } else {
      soundEngine.startAdaptiveBioFrequency(frequencyHz, binauralHz, 'alpha', 0.5, 'tibetan_bowls');
      setIsPlayingSound(true);
    }
  };

  const handleFrequencyChange = (hz: number) => {
    setFrequencyHz(hz);
    if (isPlayingSound) {
      soundEngine.transitionFrequencySmooth(hz, binauralHz, 1.5);
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(w, h) * 0.44;

      ctx.clearRect(0, 0, w, h);

      // Deep cosmic dark background with subtle vignette
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxRadius * 1.5);
      bgGrad.addColorStop(0, '#040914');
      bgGrad.addColorStop(0.7, '#020617');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      phaseRef.current += 0.015 * rotationSpeed;
      const phase = phaseRef.current;
      const pulse = 1 + Math.sin(phase * pulseSpeed * 2) * (isAudioReactive ? 0.06 : 0.02);

      const pal = PALETTES_CONFIG[palette];
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = pal.glow;
      ctx.lineWidth = lineWidth;

      ctx.save();
      ctx.translate(cx, cy);

      // 1. Draw Selected Sacred Geometry Pattern
      switch (patternType) {
        case 'flower_of_life':
          drawFlowerOfLife(ctx, maxRadius * pulse, layers, pal.colors, phase);
          break;
        case 'sri_yantra':
          drawSriYantra(ctx, maxRadius * pulse, pal.colors, phase);
          break;
        case 'metatrons_cube':
          drawMetatronsCube(ctx, maxRadius * pulse, pal.colors, phase);
          break;
        case 'torus_field':
          drawTorusField(ctx, maxRadius * pulse, layers, petals, pal.colors, phase);
          break;
        case 'golden_spiral':
          drawGoldenSpiral(ctx, maxRadius * pulse, petals, pal.colors, phase);
          break;
        case 'sahasrara_lotus':
          drawSahasraraLotus(ctx, maxRadius * pulse, layers, petals, pal.colors, phase);
          break;
        case 'chakra_harmonic':
          drawChakraHarmonic(ctx, maxRadius * pulse, pal.colors, phase, frequencyHz);
          break;
      }

      ctx.restore();

      // Outer bounding harmonic frequency circle
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      ctx.arc(0, 0, maxRadius * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = pal.colors[0];
      ctx.lineWidth = lineWidth * 0.75;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [patternType, palette, layers, petals, rotationSpeed, glowIntensity, lineWidth, pulseSpeed, isAudioReactive, frequencyHz]);

  // GEOMETRY DRAWING ROUTINES (Pure Deterministic Math)

  function drawFlowerOfLife(
    ctx: CanvasRenderingContext2D,
    radius: number,
    numRings: number,
    colors: string[],
    phase: number
  ) {
    const stepRadius = radius / (numRings + 1);

    // Center seed circle
    ctx.rotate(phase);
    ctx.strokeStyle = colors[0];
    ctx.beginPath();
    ctx.arc(0, 0, stepRadius, 0, Math.PI * 2);
    ctx.stroke();

    for (let r = 1; r <= numRings; r++) {
      const ringRadius = stepRadius * r;
      const count = 6 * r;
      const c = colors[r % colors.length];
      ctx.strokeStyle = c;

      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count;
        const x = Math.cos(angle) * ringRadius;
        const y = Math.sin(angle) * ringRadius;

        ctx.beginPath();
        ctx.arc(x, y, stepRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawSriYantra(
    ctx: CanvasRenderingContext2D,
    radius: number,
    colors: string[],
    phase: number
  ) {
    ctx.rotate(phase * 0.5);

    // Outer lotus petal rings
    const outerRadius = radius * 0.95;
    const petalCount = 16;
    ctx.strokeStyle = colors[1 % colors.length];
    for (let i = 0; i < petalCount; i++) {
      const a = (i * 2 * Math.PI) / petalCount;
      const px = Math.cos(a) * outerRadius;
      const py = Math.sin(a) * outerRadius;
      ctx.beginPath();
      ctx.arc(px, py, radius * 0.18, a - 0.7, a + 0.7);
      ctx.stroke();
    }

    // 9 Interlocking Sacred Triangles (4 Upward Shiva, 5 Downward Shakti)
    const triangles = [
      { dir: 1, scale: 0.85, c: colors[0] },
      { dir: -1, scale: 0.80, c: colors[1] },
      { dir: 1, scale: 0.72, c: colors[2] },
      { dir: -1, scale: 0.68, c: colors[3 % colors.length] },
      { dir: -1, scale: 0.58, c: colors[0] },
      { dir: 1, scale: 0.52, c: colors[1] },
      { dir: -1, scale: 0.44, c: colors[2] },
      { dir: 1, scale: 0.36, c: colors[3 % colors.length] },
      { dir: -1, scale: 0.28, c: colors[0] },
    ];

    triangles.forEach((t) => {
      ctx.strokeStyle = t.c;
      const s = radius * t.scale;
      const topY = t.dir === 1 ? -s : s;
      const botY = t.dir === 1 ? s * 0.6 : -s * 0.6;
      const halfW = s * 0.9;

      ctx.beginPath();
      ctx.moveTo(0, topY);
      ctx.lineTo(halfW, botY);
      ctx.lineTo(-halfW, botY);
      ctx.closePath();
      ctx.stroke();
    });

    // Central Bindu dot
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMetatronsCube(
    ctx: CanvasRenderingContext2D,
    radius: number,
    colors: string[],
    phase: number
  ) {
    ctx.rotate(phase * 0.4);
    const nodeRadius = radius * 0.12;
    const centers: { x: number; y: number }[] = [{ x: 0, y: 0 }];

    // 6 inner circles (Hexagon 1)
    const r1 = radius * 0.45;
    for (let i = 0; i < 6; i++) {
      const a = (i * 2 * Math.PI) / 6;
      centers.push({ x: Math.cos(a) * r1, y: Math.sin(a) * r1 });
    }

    // 6 outer circles (Hexagon 2)
    const r2 = radius * 0.85;
    for (let i = 0; i < 6; i++) {
      const a = (i * 2 * Math.PI) / 6;
      centers.push({ x: Math.cos(a) * r2, y: Math.sin(a) * r2 });
    }

    // Connect all 13 centers to each other (78 Metatronic lines)
    ctx.strokeStyle = colors[2 % colors.length];
    ctx.lineWidth = lineWidth * 0.5;
    for (let i = 0; i < centers.length; i++) {
      for (let j = i + 1; j < centers.length; j++) {
        ctx.beginPath();
        ctx.moveTo(centers[i].x, centers[i].y);
        ctx.lineTo(centers[j].x, centers[j].y);
        ctx.stroke();
      }
    }

    // Draw the 13 sacred Fruit of Life circles
    ctx.lineWidth = lineWidth;
    centers.forEach((pt, idx) => {
      ctx.strokeStyle = colors[idx % colors.length];
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, nodeRadius, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  function drawTorusField(
    ctx: CanvasRenderingContext2D,
    radius: number,
    layersCount: number,
    petalsCount: number,
    colors: string[],
    phase: number
  ) {
    const totalLines = petalsCount * 3;
    for (let l = 1; l <= layersCount; l++) {
      const r = (radius / layersCount) * l;
      const c = colors[l % colors.length];
      ctx.strokeStyle = c;

      for (let i = 0; i < totalLines; i++) {
        const theta = (i * 2 * Math.PI) / totalLines + phase * (l % 2 === 0 ? 1 : -1);
        const phi = theta * 3;

        const x = Math.cos(theta) * (r + Math.cos(phi) * (radius * 0.15));
        const y = Math.sin(theta) * (r + Math.sin(phi) * (radius * 0.15));

        ctx.beginPath();
        ctx.arc(x, y, radius * 0.08, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawGoldenSpiral(
    ctx: CanvasRenderingContext2D,
    radius: number,
    armsCount: number,
    colors: string[],
    phase: number
  ) {
    const goldenRatio = 1.61803398875;
    ctx.rotate(phase);

    for (let arm = 0; arm < armsCount; arm++) {
      const baseAngle = (arm * 2 * Math.PI) / armsCount;
      ctx.strokeStyle = colors[arm % colors.length];
      ctx.beginPath();

      let a = baseAngle;
      let r = 5;
      const step = 0.1;
      ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);

      while (r < radius) {
        a += step;
        r = 5 * Math.pow(goldenRatio, (a - baseAngle) / (Math.PI * 2));
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke();
    }
  }

  function drawSahasraraLotus(
    ctx: CanvasRenderingContext2D,
    radius: number,
    layersCount: number,
    petalsCount: number,
    colors: string[],
    phase: number
  ) {
    for (let l = 1; l <= layersCount; l++) {
      const layerRadius = (radius / layersCount) * l;
      const count = petalsCount * l;
      const c = colors[l % colors.length];
      const dir = l % 2 === 0 ? 1 : -1;
      ctx.strokeStyle = c;

      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count + phase * dir * 0.5;
        const x1 = Math.cos(angle) * (layerRadius * 0.4);
        const y1 = Math.sin(angle) * (layerRadius * 0.4);
        const x2 = Math.cos(angle) * layerRadius;
        const y2 = Math.sin(angle) * layerRadius;

        const ctrlAngle1 = angle - 0.18;
        const ctrlAngle2 = angle + 0.18;
        const cx1 = Math.cos(ctrlAngle1) * (layerRadius * 0.8);
        const cy1 = Math.sin(ctrlAngle1) * (layerRadius * 0.8);
        const cx2 = Math.cos(ctrlAngle2) * (layerRadius * 0.8);
        const cy2 = Math.sin(ctrlAngle2) * (layerRadius * 0.8);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
        ctx.stroke();
      }
    }
  }

  function drawChakraHarmonic(
    ctx: CanvasRenderingContext2D,
    radius: number,
    colors: string[],
    phase: number,
    freq: number
  ) {
    // 7 Concentric Solfeggio Harmonic frequency waves
    const frequencies = [396, 417, 528, 639, 741, 852, 963];
    const chakraColors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#a855f7'];

    frequencies.forEach((f, idx) => {
      const r = (radius / 7) * (idx + 1);
      const isSelected = Math.abs(freq - f) < 10;
      const c = isSelected ? '#ffffff' : chakraColors[idx];
      const waveCount = 6 + idx * 2;
      const waveAmp = isSelected ? 8 : 3.5;

      ctx.strokeStyle = c;
      ctx.lineWidth = isSelected ? lineWidth * 1.8 : lineWidth;
      ctx.beginPath();

      const points = 120;
      for (let i = 0; i <= points; i++) {
        const a = (i * 2 * Math.PI) / points;
        const mod = Math.sin(a * waveCount + phase * (idx + 1) * 0.6) * waveAmp;
        const currentR = r + mod;
        const x = Math.cos(a) * currentR;
        const y = Math.sin(a) * currentR;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    });
  }

  // High-Resolution PNG Export (2048x2048)
  const handleDownloadHighResPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create high-res offscreen canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 2048;
    exportCanvas.height = 2048;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    const bgGrad = ctx.createRadialGradient(1024, 1024, 100, 1024, 1024, 1400);
    bgGrad.addColorStop(0, '#040914');
    bgGrad.addColorStop(0.7, '#020617');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2048, 2048);

    const pal = PALETTES_CONFIG[palette];
    ctx.shadowBlur = glowIntensity * 2;
    ctx.shadowColor = pal.glow;
    ctx.lineWidth = lineWidth * 2.2;

    ctx.save();
    ctx.translate(1024, 1024);

    const maxRadius = 900;
    const phase = phaseRef.current;

    switch (patternType) {
      case 'flower_of_life':
        drawFlowerOfLife(ctx, maxRadius, layers, pal.colors, phase);
        break;
      case 'sri_yantra':
        drawSriYantra(ctx, maxRadius, pal.colors, phase);
        break;
      case 'metatrons_cube':
        drawMetatronsCube(ctx, maxRadius, pal.colors, phase);
        break;
      case 'torus_field':
        drawTorusField(ctx, maxRadius, layers, petals, pal.colors, phase);
        break;
      case 'golden_spiral':
        drawGoldenSpiral(ctx, maxRadius, petals, pal.colors, phase);
        break;
      case 'sahasrara_lotus':
        drawSahasraraLotus(ctx, maxRadius, layers, petals, pal.colors, phase);
        break;
      case 'chakra_harmonic':
        drawChakraHarmonic(ctx, maxRadius, pal.colors, phase, frequencyHz);
        break;
    }

    ctx.restore();

    // Export and download
    const dataUrl = exportCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `AuraBio_Mandala_${patternType}_${frequencyHz}Hz.png`;
    a.click();
  };

  const handleCopySvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-500 -500 1000 1000" width="1000" height="1000">
  <rect x="-500" y="-500" width="1000" height="1000" fill="#020617"/>
  <circle cx="0" cy="0" r="450" fill="none" stroke="${PALETTES_CONFIG[palette].colors[0]}" stroke-width="${lineWidth}" stroke-dasharray="4,8"/>
  <!-- AuraBio Sacred Geometry ${patternType} ${frequencyHz}Hz -->
</svg>`;
    navigator.clipboard.writeText(svgContent);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  const handleDownloadReportWord = () => {
    const patternNameMap: Record<SacredPatternType, string> = {
      flower_of_life: 'Yaşam Çiçeği (Flower of Life)',
      sri_yantra: 'Sri Yantra (Kutsal Matris)',
      metatrons_cube: 'Metatron Küpü (Kozmik Geometri)',
      torus_field: 'Torus Enerji Alanı (Vortex)',
      golden_spiral: 'Altın Spiral (Fibonacci Oranı)',
      sahasrara_lotus: 'Taç Nilüfer (Sahasrara Lotus)',
      chakra_harmonic: '7 Çakra Akustik Çemberi',
    };
    downloadMandalaReportWord({
      patternName: patternNameMap[patternType] || patternType,
      patternId: patternType,
      frequencyHz,
      binauralHz,
      paletteName: PALETTES_CONFIG[palette]?.name || palette,
      layers,
      petals,
      rotationSpeed,
      glowIntensity,
    });
  };

  const handleDownloadReportPDF = () => {
    const patternNameMap: Record<SacredPatternType, string> = {
      flower_of_life: 'Yaşam Çiçeği (Flower of Life)',
      sri_yantra: 'Sri Yantra (Kutsal Matris)',
      metatrons_cube: 'Metatron Küpü (Kozmik Geometri)',
      torus_field: 'Torus Enerji Alanı (Vortex)',
      golden_spiral: 'Altın Spiral (Fibonacci Oranı)',
      sahasrara_lotus: 'Taç Nilüfer (Sahasrara Lotus)',
      chakra_harmonic: '7 Çakra Akustik Çemberi',
    };
    downloadMandalaReportPDF({
      patternName: patternNameMap[patternType] || patternType,
      patternId: patternType,
      frequencyHz,
      binauralHz,
      paletteName: PALETTES_CONFIG[palette]?.name || palette,
      layers,
      petals,
      rotationSpeed,
      glowIntensity,
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      
      {/* Universal Page Navigation Bar with Back & Home Buttons */}
      <PageNavBar
        title="AI Kutsal Geometri & Aura Mandala Üreticisi"
        subtitle="Solfeggio Frekansları, Çakra Rezonansı ve Akustik Ses Titreşimleriyle Canlı Mandala Sentezi"
        icon={<Sparkles className="w-4 h-4 text-purple-400" />}
        badge={`${frequencyHz} Hz • ${binauralHz} Hz`}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
      />

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950 border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-purple-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                AI Kutsal Geometri & Aura Mandala Üreticisi
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Kuantum Rezonatör
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Solfeggio Frekansları, Çakra Rezonansı ve Akustik Ses Titreşimleriyle Canlı Mandala Sentezi
            </p>
          </div>
        </div>

        {/* Action Capsule */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleToggleSound}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 ${
              isPlayingSound 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/80 animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/80'
            }`}
          >
            {isPlayingSound ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isPlayingSound ? 'Durdur' : `${frequencyHz} Hz Dinle`}</span>
          </button>

          <button
            onClick={handleDownloadHighResPng}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95 shadow cursor-pointer"
            title="2048x2048 Ultra Yüksek Çözünürlüklü PNG İndir"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">2K PNG</span>
          </button>

          <button
            onClick={handleDownloadReportPDF}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all active:scale-95 shadow cursor-pointer"
            title="Mandala Şifa Raporu (PDF) İndir"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>PDF Rapor</span>
          </button>

          <button
            onClick={handleDownloadReportWord}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-blue-950/70 hover:bg-blue-900/80 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all active:scale-95 shadow cursor-pointer"
            title="Mandala Şifa Raporu (Word .doc) İndir"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Word Rapor</span>
          </button>

          <button
            onClick={handleCopySvg}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95 shadow cursor-pointer"
            title="Vektör SVG Kopyala"
          >
            {copiedSvg ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
            <span className="hidden sm:inline">SVG</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Canvas on Left / Controls on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Interactive Sacred Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden group">
          
          <div className="relative w-full aspect-square max-w-[540px] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl flex items-center justify-center bg-black">
            <canvas
              ref={canvasRef}
              width={720}
              height={720}
              className="w-full h-full object-contain cursor-crosshair"
            />
            
            {/* Center Live Frequency Badge */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{frequencyHz} Hz • {binauralHz} Hz Binaural</span>
            </div>

            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-400">
              {patternType.toUpperCase()}
            </div>
          </div>

          <div className="w-full max-w-[540px] flex items-center justify-between text-xs text-slate-400 mt-4 px-2">
            <span>Matematiksel Altın Oran (φ = 1.618)</span>
            <span>Aura Titreşim Frekansı: {frequencyHz} Hz</span>
          </div>
        </div>

        {/* Right 5 Columns: Customization & Frequency Controls */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 1. Sacred Geometry Pattern Selector */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kutsal Geometri Deseni</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'flower_of_life', name: 'Yaşam Çiçeği' },
                { id: 'sri_yantra', name: 'Sri Yantra' },
                { id: 'metatrons_cube', name: 'Metatron Küpü' },
                { id: 'torus_field', name: 'Torus Enerji Alanı' },
                { id: 'golden_spiral', name: 'Altın Spiral (Fibonacci)' },
                { id: 'sahasrara_lotus', name: 'Taç Nilüfer (Sahasrara)' },
                { id: 'chakra_harmonic', name: '7 Çakra Akustik Çemberi' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPatternType(p.id as SacredPatternType)}
                  className={`p-2.5 rounded-xl text-left text-xs font-bold transition-all border ${
                    patternType === p.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Solfeggio Resonating Frequency Selector */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Solfeggio Akustik Frekansı</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-none">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.hz}
                  onClick={() => handleFrequencyChange(f.hz)}
                  className={`p-2 rounded-xl text-left text-xs font-semibold transition-all border flex items-center justify-between ${
                    frequencyHz === f.hz
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{f.hz} Hz</span>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                </button>
              ))}
            </div>
          </div>

          {/* 3. Color Palette Selector */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Aura Renk Paleti</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PALETTES_CONFIG) as MandalaPalette[]).map((key) => {
                const p = PALETTES_CONFIG[key];
                return (
                  <button
                    key={key}
                    onClick={() => setPalette(key)}
                    className={`p-2.5 rounded-xl text-left text-xs font-bold transition-all border ${
                      palette === key
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {p.colors.slice(0, 4).map((c, i) => (
                        <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="truncate text-[11px]">{p.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Fine-Tuning Sliders */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Matematiksel Katman & Hız Ayarları</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Katman Sayısı: {layers}</span>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={layers}
                  onChange={(e) => setLayers(Number(e.target.value))}
                  className="w-32 accent-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Simetri & Yaprak: {petals}</span>
                <input
                  type="range"
                  min="4"
                  max="32"
                  step="2"
                  value={petals}
                  onChange={(e) => setPetals(Number(e.target.value))}
                  className="w-32 accent-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Dönüş Hızı: {rotationSpeed.toFixed(1)}x</span>
                <input
                  type="range"
                  min="0.1"
                  max="2.5"
                  step="0.1"
                  value={rotationSpeed}
                  onChange={(e) => setRotationSpeed(Number(e.target.value))}
                  className="w-32 accent-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Neon Aura Işıltısı: {glowIntensity}px</span>
                <input
                  type="range"
                  min="5"
                  max="35"
                  value={glowIntensity}
                  onChange={(e) => setGlowIntensity(Number(e.target.value))}
                  className="w-32 accent-emerald-500"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
