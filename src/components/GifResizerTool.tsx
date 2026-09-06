// src/components/GifResizerTool.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Sparkles,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  Sliders,
  Palette,
  Zap,
  Layers,
  ArrowRight,
  Info,
  ExternalLink,
  FileImage,
  SplitSquareVertical,
  Columns2,
  Maximize2,
  Scissors,
  RotateCcw,
  Gauge,
  Target,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type {
  Language,
  DecodedGif,
  ResizeMode,
  ResizeOptions,
  OptimizationOptions,
  EncodedGifResult,
  PlatformPreset,
  PaletteColors,
  FrameSkipMode,
  ColorFormat,
  ComparisonMode,
} from '../types';
import { PLATFORM_PRESETS } from '../data/presets';
import { getTranslation } from '../data/i18n';
import {
  decodeGif,
  encodeOptimizedGif,
  createSampleGif,
  formatBytes,
  calculateOptimalTargetSettings,
} from '../utils/gifEngine';

export const GifResizerTool: React.FC = () => {
  // Language state (persisted or default 'ko')
  const [lang, setLang] = useState<Language>('ko');
  const t = getTranslation(lang);

  // Core loading & progress state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Loaded GIF data
  const [decodedGif, setDecodedGif] = useState<DecodedGif | null>(null);
  const [originalBlobUrl, setOriginalBlobUrl] = useState<string | null>(null);
  const [resultGif, setResultGif] = useState<EncodedGifResult | null>(null);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<'target' | 'resize' | 'compress' | 'speed'>('target');

  // Comparison view mode
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('split');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0 - 100
  const isDraggingSplit = useRef<boolean>(false);

  // Target size solver
  const [targetKb, setTargetKb] = useState<number>(256);
  const [targetPresetId, setTargetPresetId] = useState<string>('discord-emoji-256kb');

  // Resize settings
  const [resizeMode, setResizeMode] = useState<ResizeMode>('dimensions');
  const [width, setWidth] = useState<number>(480);
  const [height, setHeight] = useState<number>(480);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);
  const [scalePercentage, setScalePercentage] = useState<number>(75);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('kakaotalk-profile');

  // Optimization settings
  const [maxColors, setMaxColors] = useState<PaletteColors>(128);
  const [frameSkip, setFrameSkip] = useState<FrameSkipMode>(1);
  const [colorFormat, setColorFormat] = useState<ColorFormat>('rgb565');
  const [dither, setDither] = useState<boolean>(true);

  // Speed, Reverse & Trimming
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [reverseAnimation, setReverseAnimation] = useState<boolean>(false);
  const [trimStartFrame, setTrimStartFrame] = useState<number>(0);
  const [trimEndFrame, setTrimEndFrame] = useState<number>(0);

  // Playback & preview state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Canvas refs
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const optimizedCanvasRef = useRef<HTMLCanvasElement>(null);
  const splitCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Listen for global language switch event dispatched from Header
  useEffect(() => {
    const handleLangChange = (e: CustomEvent<Language>) => {
      if (e.detail) setLang(e.detail);
    };
    window.addEventListener('app:lang-change' as any, handleLangChange);
    return () => window.removeEventListener('app:lang-change' as any, handleLangChange);
  }, []);

  // Preset selection from platform table
  useEffect(() => {
    const handlePresetSelect = (e: CustomEvent<string>) => {
      const presetId = e.detail;
      const preset = PLATFORM_PRESETS.find((p) => p.id === presetId);
      if (preset && decodedGif) {
        applyPreset(preset);
        const toolEl = document.getElementById('tool-workspace');
        if (toolEl) toolEl.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('app:preset-select' as any, handlePresetSelect);
    return () => window.removeEventListener('app:preset-select' as any, handlePresetSelect);
  }, [decodedGif]);

  // Global paste handler (Ctrl+V anywhere on the page)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.includes('image')) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Process uploaded or pasted GIF file
  const processFile = async (file: File) => {
    if (!file) return;
    setIsLoading(true);
    setStatusMessage(t.decoding);
    setErrorMsg(null);
    setProgressPct(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await decodeGif(arrayBuffer, file.name);

      setDecodedGif(decoded);
      setWidth(decoded.width);
      setHeight(decoded.height);
      setTrimStartFrame(0);
      setTrimEndFrame(decoded.frames.length - 1);
      setCurrentFrameIdx(0);

      // Create blob URL for direct original inspection
      const originalBlob = new Blob([arrayBuffer], { type: 'image/gif' });
      const origUrl = URL.createObjectURL(originalBlob);
      setOriginalBlobUrl(origUrl);

      // Automatically run first pass with balanced settings
      setStatusMessage(t.encoding);
      setProgressPct(40);

      const res = await encodeOptimizedGif(
        decoded,
        {
          mode: 'dimensions',
          targetWidth: decoded.width,
          targetHeight: decoded.height,
          keepAspectRatio: true,
          percentage: 100,
        },
        {
          maxColors: 128,
          frameSkip: 1,
          colorFormat: 'rgb565',
          dither: true,
          speedMultiplier: 1.0,
          reverseAnimation: false,
          trimStartFrame: 0,
          trimEndFrame: decoded.frames.length - 1,
        },
        (pct) => setProgressPct(40 + Math.round(pct * 0.55))
      );

      setResultGif(res);
      setProgressPct(100);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to process GIF file.');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Load sample demonstration GIF
  const handleLoadSample = async () => {
    setIsLoading(true);
    setStatusMessage('Generating interactive sample GIF...');
    setProgressPct(20);

    try {
      const buffer = await createSampleGif();
      const file = new File([buffer], 'sample-animation.gif', { type: 'image/gif' });
      await processFile(file);
    } catch (err: any) {
      setErrorMsg('Failed to load sample: ' + err.message);
      setIsLoading(false);
    }
  };

  // Run optimization pass
  const handleApplyOptimization = async () => {
    if (!decodedGif) return;

    setIsLoading(true);
    setStatusMessage(t.encoding);
    setErrorMsg(null);
    setProgressPct(5);

    try {
      // Calculate target dimensions
      let targetW = width;
      let targetH = height;

      if (resizeMode === 'percentage') {
        const factor = scalePercentage / 100;
        targetW = Math.max(16, Math.round(decodedGif.width * factor));
        targetH = Math.max(16, Math.round(decodedGif.height * factor));
      }

      const res = await encodeOptimizedGif(
        decodedGif,
        {
          mode: resizeMode,
          targetWidth: targetW,
          targetHeight: targetH,
          keepAspectRatio: aspectRatioLocked,
          percentage: scalePercentage,
        },
        {
          maxColors,
          frameSkip,
          colorFormat,
          dither,
          speedMultiplier,
          reverseAnimation,
          trimStartFrame,
          trimEndFrame,
        },
        (pct) => setProgressPct(pct)
      );

      setResultGif(res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Optimization failed.');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Smart Target Solver: One-click auto solver to fit Discord 256KB, 512KB, Kakao 10MB, etc.
  const handleApplyTargetSolve = async (targetBytes: number) => {
    if (!decodedGif) return;

    const settings = calculateOptimalTargetSettings(decodedGif, targetBytes);
    setWidth(settings.targetWidth);
    setHeight(settings.targetHeight);
    setScalePercentage(settings.percentage);
    setMaxColors(settings.maxColors);
    setFrameSkip(settings.frameSkip);
    setColorFormat(settings.colorFormat);

    setIsLoading(true);
    setStatusMessage(`${t.btnAutoSolve} (${formatBytes(targetBytes)})...`);
    setProgressPct(10);

    try {
      const res = await encodeOptimizedGif(
        decodedGif,
        {
          mode: 'dimensions',
          targetWidth: settings.targetWidth,
          targetHeight: settings.targetHeight,
          keepAspectRatio: true,
          percentage: settings.percentage,
        },
        {
          maxColors: settings.maxColors,
          frameSkip: settings.frameSkip,
          colorFormat: settings.colorFormat,
          dither,
          speedMultiplier,
          reverseAnimation,
          trimStartFrame,
          trimEndFrame,
        },
        (pct) => setProgressPct(pct)
      );

      setResultGif(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Target solve failed.');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Apply preset
  const applyPreset = (preset: PlatformPreset) => {
    if (!decodedGif) return;
    setSelectedPresetId(preset.id);
    setResizeMode('dimensions');

    if (preset.width && preset.height) {
      if (aspectRatioLocked) {
        const srcRatio = decodedGif.width / decodedGif.height;
        const targetRatio = preset.width / preset.height;
        if (srcRatio > targetRatio) {
          setWidth(preset.width);
          setHeight(Math.round(preset.width / srcRatio));
        } else {
          setHeight(preset.height);
          setWidth(Math.round(preset.height * srcRatio));
        }
      } else {
        setWidth(preset.width);
        setHeight(preset.height);
      }
    }

    if (preset.recommendedColors) setMaxColors(preset.recommendedColors);
    if (preset.recommendedSkip) setFrameSkip(preset.recommendedSkip);
    if (preset.recommendedFormat) setColorFormat(preset.recommendedFormat);
  };

  // Dimension input changes with aspect ratio sync
  const handleWidthChange = (val: number) => {
    const newW = Math.max(16, val);
    setWidth(newW);
    if (aspectRatioLocked && decodedGif) {
      const ratio = decodedGif.height / decodedGif.width;
      setHeight(Math.max(16, Math.round(newW * ratio)));
    }
  };

  const handleHeightChange = (val: number) => {
    const newH = Math.max(16, val);
    setHeight(newH);
    if (aspectRatioLocked && decodedGif) {
      const ratio = decodedGif.width / decodedGif.height;
      setWidth(Math.max(16, Math.round(newH * ratio)));
    }
  };

  // Synchronized playback animation loop
  useEffect(() => {
    if (!decodedGif || !isPlaying) return;

    let frameIndex = currentFrameIdx;
    const totalFrames = decodedGif.frames.length;

    const loop = (timestamp: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const currentDelay = decodedGif.frames[frameIndex]?.delayMs || 100;
      const effectiveDelay = currentDelay / speedMultiplier;

      if (timestamp - lastFrameTimeRef.current >= effectiveDelay) {
        lastFrameTimeRef.current = timestamp;
        frameIndex = (frameIndex + 1) % totalFrames;
        setCurrentFrameIdx(frameIndex);
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [decodedGif, isPlaying, speedMultiplier, currentFrameIdx]);

  // Render frames to canvases
  useEffect(() => {
    if (!decodedGif) return;

    const frame = decodedGif.frames[currentFrameIdx];
    if (!frame) return;

    // Draw original
    if (originalCanvasRef.current) {
      const canvas = originalCanvasRef.current;
      canvas.width = decodedGif.width;
      canvas.height = decodedGif.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imgData = new ImageData(
          new Uint8ClampedArray(frame.rgbaData.buffer, frame.rgbaData.byteOffset, frame.rgbaData.byteLength),
          decodedGif.width,
          decodedGif.height
        );
        ctx.putImageData(imgData, 0, 0);
      }
    }

    // Draw optimized preview
    if (optimizedCanvasRef.current && resultGif) {
      const canvas = optimizedCanvasRef.current;
      canvas.width = resultGif.width;
      canvas.height = resultGif.height;
      const ctx = canvas.getContext('2d');
      if (ctx && originalCanvasRef.current) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, resultGif.width, resultGif.height);
        ctx.drawImage(originalCanvasRef.current, 0, 0, resultGif.width, resultGif.height);
      }
    }

    // Draw split-screen interactive wipe
    if (splitCanvasRef.current && originalCanvasRef.current) {
      const canvas = splitCanvasRef.current;
      canvas.width = decodedGif.width;
      canvas.height = decodedGif.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw left side (Original)
        const splitPixel = (canvas.width * splitPos) / 100;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitPixel, canvas.height);
        ctx.clip();
        ctx.drawImage(originalCanvasRef.current, 0, 0);
        ctx.restore();

        // Draw right side (Optimized scaled back up to canvas size for pixel-by-pixel inspection)
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitPixel, 0, canvas.width - splitPixel, canvas.height);
        ctx.clip();
        if (optimizedCanvasRef.current) {
          ctx.drawImage(optimizedCanvasRef.current, 0, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(originalCanvasRef.current, 0, 0);
        }
        ctx.restore();

        // Draw dividing vertical line with cyan glow
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(splitPixel, 0);
        ctx.lineTo(splitPixel, canvas.height);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }, [decodedGif, currentFrameIdx, resultGif, splitPos]);

  // Handle split-screen dragging
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSplit.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSplitPos(Math.round((x / rect.width) * 100));
  };

  const handleSplitTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    setSplitPos(Math.round((x / rect.width) * 100));
  };

  // Copy GIF to clipboard
  const handleCopyToClipboard = async () => {
    if (!resultGif) return;
    try {
      const item = new ClipboardItem({ [resultGif.blob.type]: resultGif.blob });
      await navigator.clipboard.write([item]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.warn('Direct image/gif copy failed, trying PNG fallback', err);
      try {
        if (optimizedCanvasRef.current) {
          optimizedCanvasRef.current.toBlob(async (pngBlob) => {
            if (pngBlob) {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
              setCopySuccess(true);
              setTimeout(() => setCopySuccess(false), 3000);
            }
          });
        }
      } catch (fallbackErr) {
        alert(t.copyError);
      }
    }
  };

  // Download optimized GIF
  const handleDownload = () => {
    if (!resultGif || !decodedGif) return;
    const link = document.createElement('a');
    link.href = resultGif.blobUrl;
    const baseName = decodedGif.originalFileName.replace(/\.[^/.]+$/, '');
    link.download = `${baseName}_optimized_${resultGif.width}x${resultGif.height}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset tool
  const handleReset = () => {
    setDecodedGif(null);
    setResultGif(null);
    setOriginalBlobUrl(null);
    setErrorMsg(null);
    setProgressPct(0);
    setCurrentFrameIdx(0);
  };

  // Calculate stats
  const origSize = decodedGif?.originalFileSizeBytes || 0;
  const newSize = resultGif?.fileSizeBytes || 0;
  const sizeDiff = origSize - newSize;
  const pctReduced = origSize > 0 && newSize > 0 ? Math.round(((origSize - newSize) / origSize) * 100) : 0;

  return (
    <div id="tool-workspace" className="w-full space-y-8">
      {/* ========================================================================= */}
      {/* 1. UPLOAD ZONE OR ACTIVE STUDIO                                           */}
      {/* ========================================================================= */}
      {!decodedGif ? (
        <div className="relative group rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-card/60 backdrop-blur-md p-8 sm:p-14 text-center transition-all duration-300 shadow-sm hover:shadow-lg">
          <input
            type="file"
            id="gif-file-input"
            accept="image/gif"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            title=""
          />

          <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
                {t.dropzoneTitle}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                {t.dropzoneSub}
              </p>
            </div>

            {/* Paste Badge & Quick Presets info */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                {t.dropzonePasteHint}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Zap className="w-3.5 h-3.5" />
                Discord 256KB / Kakao 10MB 지원
              </span>
            </div>
          </div>

          {/* Quick Buttons below dropzone */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 relative z-20">
            <label
              htmlFor="gif-file-input"
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-2"
            >
              <FileImage className="w-4 h-4" />
              {t.uploadBtn}
            </label>

            <button
              type="button"
              onClick={handleLoadSample}
              disabled={isLoading}
              className="px-5 py-3 rounded-xl border border-border bg-card/80 hover:bg-accent text-foreground text-sm font-semibold transition inline-flex items-center gap-2 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-cyan-500" />
              {t.loadSampleBtn}
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. ACTIVE STUDIO WORKSPACE                                                */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Top Quick Platform Target Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Target className="w-4 h-4 text-primary" />
              <span>원클릭 목표 프리셋:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyTargetSolve(256 * 1024)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-muted hover:bg-primary hover:text-primary-foreground transition border border-border/80 flex items-center gap-1.5"
              >
                <span>디스코드 이모지 (≤256 KB)</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyTargetSolve(512 * 1024)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-muted hover:bg-primary hover:text-primary-foreground transition border border-border/80 flex items-center gap-1.5"
              >
                <span>디스코드 스티커 (≤512 KB)</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyTargetSolve(10 * 1024 * 1024)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-muted hover:bg-primary hover:text-primary-foreground transition border border-border/80 flex items-center gap-1.5"
              >
                <span>카톡 / 디시 / 디스코드 (≤10 MB)</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{t.btnReset}</span>
              </button>
            </div>
          </div>

          {/* Main Grid: Left Controls (40%) + Right Interactive Studio (60%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* =================================================================== */}
            {/* LEFT COLUMN: CONTROL TABS (5 Cols)                                 */}
            {/* =================================================================== */}
            <div className="lg:col-span-5 space-y-4">
              {/* Tab Selector Header */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-muted/60 rounded-xl border border-border text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('target')}
                  className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 ${
                    activeTab === 'target'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Target className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="truncate">목표 용량</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('resize')}
                  className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 ${
                    activeTab === 'resize'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate">해상도</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('compress')}
                  className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 ${
                    activeTab === 'compress'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-amber-500" />
                  <span className="truncate">색상/압축</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('speed')}
                  className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 ${
                    activeTab === 'speed'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="truncate">속도/트림</span>
                </button>
              </div>

              {/* Tab 1: Smart Target Solver */}
              {activeTab === 'target' && (
                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Target className="w-4 h-4 text-cyan-500" />
                      {t.targetSectionTitle}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t.targetSectionDesc}
                    </p>
                  </div>

                  {/* Quick Target Options Cards */}
                  <div className="space-y-2">
                    {[
                      { id: 'discord-emoji', label: 'Discord Custom Emoji', limit: '256 KB', desc: '128×128 px, Nitro 없이 업로드 가능', bytes: 256 * 1024 },
                      { id: 'discord-sticker', label: 'Discord Custom Sticker', limit: '512 KB', desc: '320×320 px, 애니메이션 스티커 규격', bytes: 512 * 1024 },
                      { id: 'discord-kakao-10mb', label: '카카오톡 / 디시 / 디스코드 첨부', limit: '10 MB', desc: '가장 널리 쓰이는 표준 10MB 한도 맞춤', bytes: 10 * 1024 * 1024 },
                      { id: 'kakao-naver-20mb', label: '카카오 채팅 / 네이버 카페', limit: '20 MB', desc: '고화질 대형 움짤 20MB 상한 규격', bytes: 20 * 1024 * 1024 },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleApplyTargetSolve(item.bytes)}
                        className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/60 bg-muted/30 hover:bg-accent/40 transition group flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-foreground group-hover:text-primary transition">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">
                          {item.limit}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Target Size Input */}
                  <div className="pt-3 border-t border-border space-y-3">
                    <label className="text-xs font-bold text-foreground block">
                      {t.customTargetLabel}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="50"
                        max="50000"
                        value={targetKb}
                        onChange={(e) => setTargetKb(Math.max(10, parseInt(e.target.value) || 256))}
                        className="flex-1 px-3 py-2 rounded-lg bg-background border border-input text-xs font-mono font-bold focus:ring-2 focus:ring-primary/40 outline-none"
                      />
                      <span className="text-xs font-mono text-muted-foreground">KB</span>
                      <button
                        type="button"
                        onClick={() => handleApplyTargetSolve(targetKb * 1024)}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs"
                      >
                        {t.btnAutoSolve}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Dimensions & Scale */}
              {activeTab === 'resize' && (
                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-5">
                  <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setResizeMode('dimensions')}
                      className={`flex-1 py-1.5 rounded-lg transition ${
                        resizeMode === 'dimensions' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
                      }`}
                    >
                      {t.modeDimensions}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResizeMode('percentage')}
                      className={`flex-1 py-1.5 rounded-lg transition ${
                        resizeMode === 'percentage' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
                      }`}
                    >
                      {t.modePercentage}
                    </button>
                  </div>

                  {resizeMode === 'dimensions' ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">{t.widthLabel} (px)</label>
                          <input
                            type="number"
                            min="16"
                            max="3840"
                            value={width}
                            onChange={(e) => handleWidthChange(parseInt(e.target.value) || 16)}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-xs font-mono font-bold focus:ring-2 focus:ring-primary/40 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">{t.heightLabel} (px)</label>
                          <input
                            type="number"
                            min="16"
                            max="3840"
                            value={height}
                            onChange={(e) => handleHeightChange(parseInt(e.target.value) || 16)}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-xs font-mono font-bold focus:ring-2 focus:ring-primary/40 outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
                      >
                        {aspectRatioLocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-primary" />
                            <span>{t.lockAspect}</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{t.unlockAspect}</span>
                          </>
                        )}
                      </button>

                      {/* Quick Ratio Pills */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        {[
                          { label: '128×128 (Emoji)', w: 128, h: 128 },
                          { label: '320×320 (Sticker)', w: 320, h: 320 },
                          { label: '480px', w: 480 },
                          { label: '640px', w: 640 },
                          { label: '720px', w: 720 },
                        ].map((btn, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (btn.h) {
                                setWidth(btn.w);
                                setHeight(btn.h);
                              } else {
                                handleWidthChange(btn.w);
                              }
                            }}
                            className="px-2.5 py-1 rounded-md bg-muted text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent transition"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">{t.percentageLabel}</span>
                        <span className="font-mono font-bold text-primary">{scalePercentage}%</span>
                      </div>

                      <input
                        type="range"
                        min="10"
                        max="150"
                        step="5"
                        value={scalePercentage}
                        onChange={(e) => setScalePercentage(parseInt(e.target.value))}
                        className="w-full h-2 rounded-lg bg-muted accent-primary cursor-pointer"
                      />

                      <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Colors & Compression Mode */}
              {activeTab === 'compress' && (
                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-5">
                  {/* Palette selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground block">
                      {t.paletteLabel}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {([256, 192, 128, 96, 64, 32, 16] as PaletteColors[]).map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setMaxColors(col)}
                          className={`py-2 px-1 rounded-lg text-xs font-mono font-bold border transition ${
                            maxColors === col
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                              : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          {col}색
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t.paletteDesc}</p>
                  </div>

                  {/* Frame Skip Subsampling */}
                  <div className="space-y-2 pt-3 border-t border-border">
                    <label className="text-xs font-bold text-foreground block">
                      {t.frameSkipLabel}
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { val: 1, label: '모든 프레임 (100%)' },
                        { val: 2, label: '2장마다 1장 (-50%)' },
                        { val: 3, label: '3장마다 1장 (-67%)' },
                        { val: 4, label: '4장마다 1장 (-75%)' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setFrameSkip(item.val as FrameSkipMode)}
                          className={`p-2 rounded-lg text-left border transition ${
                            frameSkip === item.val
                              ? 'bg-primary/10 border-primary text-primary font-bold'
                              : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t.frameSkipDesc}</p>
                  </div>

                  {/* Pixel Format */}
                  <div className="space-y-2 pt-3 border-t border-border">
                    <label className="text-xs font-bold text-foreground block">
                      {t.colorFormatLabel}
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      {[
                        { id: 'rgb565', label: 'RGB565', desc: '고선명' },
                        { id: 'rgb444', label: 'RGB444', desc: '고압축' },
                        { id: 'rgba4444', label: 'RGBA4444', desc: '투명도' },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setColorFormat(fmt.id as ColorFormat)}
                          className={`p-2 rounded-lg text-center border transition ${
                            colorFormat === fmt.id
                              ? 'bg-primary text-primary-foreground border-primary font-bold'
                              : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          <div>{fmt.label}</div>
                          <div className="text-[10px] opacity-75">{fmt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Speed & Trimming */}
              {activeTab === 'speed' && (
                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-5">
                  {/* Speed buttons */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground block">
                      {t.speedLabel}
                    </label>
                    <div className="grid grid-cols-6 gap-1.5 font-mono text-xs">
                      {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSpeedMultiplier(s)}
                          className={`py-1.5 rounded-lg border transition ${
                            speedMultiplier === s
                              ? 'bg-primary text-primary-foreground border-primary font-bold'
                              : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reverse Animation */}
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-foreground">{t.reverseLabel}</div>
                      <div className="text-[11px] text-muted-foreground">{t.reverseDesc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReverseAnimation(!reverseAnimation)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        reverseAnimation ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                          reverseAnimation ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Timeline Frame Trimming */}
                  <div className="pt-3 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-foreground">{t.trimTitle}</div>
                      <span className="text-xs font-mono text-cyan-500 font-bold">
                        프레임 {trimStartFrame + 1} ~ {trimEndFrame + 1} (총 {trimEndFrame - trimStartFrame + 1}장)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">{t.trimStart}</span>
                        <input
                          type="number"
                          min="0"
                          max={trimEndFrame}
                          value={trimStartFrame + 1}
                          onChange={(e) => setTrimStartFrame(Math.max(0, parseInt(e.target.value) - 1 || 0))}
                          className="w-full px-3 py-1.5 rounded-lg bg-background border border-input text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">{t.trimEnd}</span>
                        <input
                          type="number"
                          min={trimStartFrame}
                          max={decodedGif.frames.length - 1}
                          value={trimEndFrame + 1}
                          onChange={(e) => setTrimEndFrame(Math.min(decodedGif.frames.length - 1, parseInt(e.target.value) - 1 || 0))}
                          className="w-full px-3 py-1.5 rounded-lg bg-background border border-input text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t.trimDesc}</p>
                  </div>
                </div>
              )}

              {/* Action Button: Apply changes */}
              <button
                type="button"
                onClick={handleApplyOptimization}
                disabled={isLoading}
                className="w-full py-3.5 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{statusMessage || t.encoding} ({progressPct}%)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t.btnReapply}</span>
                  </>
                )}
              </button>
            </div>

            {/* =================================================================== */}
            {/* RIGHT COLUMN: INTERACTIVE STUDIO & BEFORE/AFTER VIEWER (7 Cols)     */}
            {/* =================================================================== */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Studio Canvas Card */}
              <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm flex flex-col">
                
                {/* Canvas Header Toolbar */}
                <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setComparisonMode('split')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                        comparisonMode === 'split' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title={t.viewSplit}
                    >
                      <SplitSquareVertical className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.viewSplit}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setComparisonMode('side')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                        comparisonMode === 'side' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title={t.viewSide}
                    >
                      <Columns2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.viewSide}</span>
                    </button>
                  </div>

                  {/* Play / Pause / Step Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentFrameIdx((prev) => (prev - 1 + decodedGif.frames.length) % decodedGif.frames.length)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                      title="이전 프레임"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
                      title={isPlaying ? t.pause : t.play}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentFrameIdx((prev) => (prev + 1) % decodedGif.frames.length)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                      title="다음 프레임"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <span className="text-xs font-mono text-muted-foreground">
                      {currentFrameIdx + 1}/{decodedGif.frames.length}
                    </span>
                  </div>
                </div>

                {/* Viewport Canvas Surface */}
                <div
                  ref={containerRef}
                  onMouseDown={() => (isDraggingSplit.current = true)}
                  onMouseUp={() => (isDraggingSplit.current = false)}
                  onMouseLeave={() => (isDraggingSplit.current = false)}
                  onMouseMove={handleSplitMouseMove}
                  onTouchMove={handleSplitTouchMove}
                  className="relative min-h-[320px] sm:min-h-[380px] flex items-center justify-center p-4 bg-[linear-gradient(45deg,#1e293b15_25%,transparent_25%),linear-gradient(-45deg,#1e293b15_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b15_75%),linear-gradient(-45deg,transparent_75%,#1e293b15_75%)] bg-[size:20px_20px] select-none"
                >
                  {/* Mode 1: Interactive Split-Screen Wipe */}
                  {comparisonMode === 'split' && (
                    <div className="relative max-w-full max-h-[420px] rounded-lg overflow-hidden border border-border shadow-md">
                      <canvas
                        ref={splitCanvasRef}
                        className="max-w-full max-h-[420px] object-contain block mx-auto cursor-ew-resize"
                      />

                      {/* Split-screen labels */}
                      <div className="absolute top-2 left-2 pointer-events-none px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                        Original ({decodedGif.width}px)
                      </div>
                      <div className="absolute top-2 right-2 pointer-events-none px-2 py-0.5 rounded bg-primary/80 backdrop-blur-sm text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                        Optimized ({resultGif?.width || width}px)
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Side-by-Side View */}
                  {comparisonMode === 'side' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <div className="space-y-1 text-center">
                        <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                          Original ({formatBytes(origSize)})
                        </span>
                        <div className="rounded-lg border border-border overflow-hidden bg-black/5">
                          <canvas
                            ref={originalCanvasRef}
                            className="max-w-full max-h-[280px] object-contain mx-auto block"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-center">
                        <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
                          Optimized ({formatBytes(newSize)})
                        </span>
                        <div className="rounded-lg border border-primary/40 overflow-hidden bg-black/5 shadow-xs">
                          <canvas
                            ref={optimizedCanvasRef}
                            className="max-w-full max-h-[280px] object-contain mx-auto block"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hidden fallback canvases for computation */}
                  <canvas ref={originalCanvasRef} className="hidden" />
                  <canvas ref={optimizedCanvasRef} className="hidden" />
                </div>

                {/* Timeline Scrubber Bar */}
                <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-3">
                  <span className="text-[11px] font-mono text-muted-foreground">0</span>
                  <input
                    type="range"
                    min="0"
                    max={decodedGif.frames.length - 1}
                    value={currentFrameIdx}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setCurrentFrameIdx(parseInt(e.target.value));
                    }}
                    className="flex-1 h-1.5 bg-muted rounded-lg accent-primary cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-muted-foreground">{decodedGif.frames.length - 1}</span>
                </div>
              </div>

              {/* Real-time Compression Metrics Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-card border border-border shadow-xs space-y-0.5">
                  <div className="text-[11px] text-muted-foreground uppercase font-semibold">원본 크기</div>
                  <div className="text-sm sm:text-base font-mono font-bold text-foreground">
                    {formatBytes(origSize)}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {decodedGif.width}×{decodedGif.height} px
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border shadow-xs space-y-0.5">
                  <div className="text-[11px] text-primary uppercase font-semibold">최적화 크기</div>
                  <div className="text-sm sm:text-base font-mono font-bold text-foreground">
                    {formatBytes(newSize)}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {resultGif?.width || width}×{resultGif?.height || height} px
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-xs space-y-0.5">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">용량 절감률</div>
                  <div className="text-sm sm:text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {pctReduced > 0 ? `-${pctReduced}%` : '0%'}
                  </div>
                  <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-mono">
                    {sizeDiff > 0 ? `-${formatBytes(sizeDiff)}` : '동일'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border shadow-xs space-y-0.5">
                  <div className="text-[11px] text-cyan-500 uppercase font-semibold">인코딩 속도</div>
                  <div className="text-sm sm:text-base font-mono font-bold text-foreground">
                    {resultGif ? `${resultGif.processingTimeMs} ms` : '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    100% 로컬 처리
                  </div>
                </div>
              </div>

              {/* Action Buttons: Download & Copy */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!resultGif}
                  className="flex-1 py-3 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.btnDownload}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  disabled={!resultGif}
                  className="py-3 px-5 rounded-xl border border-border bg-card hover:bg-accent text-foreground font-bold text-sm transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500">복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t.btnCopy}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
