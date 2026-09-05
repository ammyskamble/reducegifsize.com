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
} from '../types';
import { PLATFORM_PRESETS } from '../data/presets';
import { getTranslation } from '../data/i18n';
import { decodeGif, encodeOptimizedGif, createSampleGif, formatBytes } from '../utils/gifEngine';

export const GifResizerTool: React.FC = () => {
  // Language state (persisted or default 'ko')
  const [lang, setLang] = useState<Language>('ko');
  const t = getTranslation(lang);

  // Core state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Loaded GIF data
  const [decodedGif, setDecodedGif] = useState<DecodedGif | null>(null);
  const [originalBlobUrl, setOriginalBlobUrl] = useState<string | null>(null);
  const [resultGif, setResultGif] = useState<EncodedGifResult | null>(null);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<'resize' | 'compress' | 'speed'>('resize');

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
  const [dither, setDither] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);

  // Playback & preview state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Canvas refs for drawing frames
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const optimizedCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Listen for global language switch event dispatched from Astro Header
  useEffect(() => {
    const handleLangChange = (e: CustomEvent<Language>) => {
      if (e.detail) setLang(e.detail);
    };
    window.addEventListener('app:lang-change' as any, handleLangChange);
    return () => window.removeEventListener('app:lang-change' as any, handleLangChange);
  }, []);

  // Listen for platform preset selection event dispatched from PlatformSpecsTable
  useEffect(() => {
    const handlePresetSelect = (e: CustomEvent<string>) => {
      const presetId = e.detail;
      const preset = PLATFORM_PRESETS.find((p) => p.id === presetId);
      if (preset && decodedGif) {
        applyPreset(preset);
        // Scroll smoothly to tool workspace
        const toolEl = document.getElementById('tool-workspace');
        if (toolEl) toolEl.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('app:select-preset' as any, handlePresetSelect);
    return () => window.removeEventListener('app:select-preset' as any, handlePresetSelect);
  }, [decodedGif]);

  // Load GIF from file or buffer
  const handleFileLoad = useCallback(async (file: File | Blob, fileName: string = 'animation.gif') => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setStatusMessage(t.decoding);
      setProgressPct(10);

      const buffer = await file.arrayBuffer();
      const decoded = await decodeGif(buffer, fileName);

      setDecodedGif(decoded);
      setWidth(decoded.width);
      setHeight(decoded.height);
      setScalePercentage(100);

      // Create blob URL for original view
      const origBlob = new Blob([buffer], { type: 'image/gif' });
      const origUrl = URL.createObjectURL(origBlob);
      setOriginalBlobUrl(origUrl);

      // Trigger initial optimization automatically
      setStatusMessage(t.encoding);
      setProgressPct(30);

      const initialResize: ResizeOptions = {
        mode: 'dimensions',
        targetWidth: decoded.width,
        targetHeight: decoded.height,
        keepAspectRatio: true,
        percentage: 100,
      };
      const initialOpt: OptimizationOptions = {
        maxColors: 128,
        frameSkip: 1,
        dither: true,
        speedMultiplier: 1.0,
      };

      const result = await encodeOptimizedGif(decoded, initialResize, initialOpt, (p) => {
        setProgressPct(30 + Math.round(p * 0.7));
      });

      setResultGif(result);
      setCurrentFrameIdx(0);
      setIsPlaying(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to process GIF file.');
    } finally {
      setIsLoading(false);
      setProgressPct(0);
      setStatusMessage('');
    }
  }, [t]);

  // Sample GIF button click
  const handleLoadSample = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setStatusMessage('Creating sample animated GIF...');
      const sampleBuffer = await createSampleGif();
      const sampleBlob = new Blob([sampleBuffer], { type: 'image/gif' });
      await handleFileLoad(sampleBlob, 'sample_korea_demo.gif');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating sample GIF');
      setIsLoading(false);
    }
  };

  // Drag & drop handlers
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'image/gif' || file.name.endsWith('.gif')) {
        handleFileLoad(file, file.name);
      } else {
        setErrorMsg('Please upload a valid animated .gif file.');
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Clipboard paste support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type === 'image/gif') {
          const blob = items[i].getAsFile();
          if (blob) {
            handleFileLoad(blob, 'pasted_animation.gif');
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFileLoad]);

  // Handle aspect ratio locked dimension inputs
  const handleWidthChange = (newWidth: number) => {
    const w = Math.max(16, newWidth);
    setWidth(w);
    if (aspectRatioLocked && decodedGif && decodedGif.width > 0) {
      const calculatedHeight = Math.round((w / decodedGif.width) * decodedGif.height);
      setHeight(Math.max(16, calculatedHeight));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    const h = Math.max(16, newHeight);
    setHeight(h);
    if (aspectRatioLocked && decodedGif && decodedGif.height > 0) {
      const calculatedWidth = Math.round((h / decodedGif.height) * decodedGif.width);
      setWidth(Math.max(16, calculatedWidth));
    }
  };

  // Handle percentage change
  const handlePercentageChange = (pct: number) => {
    setScalePercentage(pct);
    if (decodedGif) {
      setWidth(Math.round((decodedGif.width * pct) / 100));
      setHeight(Math.round((decodedGif.height * pct) / 100));
    }
  };

  // Apply preset
  const applyPreset = (preset: PlatformPreset) => {
    setSelectedPresetId(preset.id);
    setResizeMode('preset');
    if (preset.width) setWidth(preset.width);
    if (preset.height) setHeight(preset.height);
    if (preset.recommendedColors) setMaxColors(preset.recommendedColors);
    if (preset.recommendedSkip) setFrameSkip(preset.recommendedSkip);
  };

  // Re-encode GIF with current parameters
  const handleApplyChanges = async () => {
    if (!decodedGif) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setStatusMessage(t.encoding);
      setProgressPct(0);

      const resizeOpts: ResizeOptions = {
        mode: resizeMode,
        targetWidth: width,
        targetHeight: height,
        keepAspectRatio: aspectRatioLocked,
        percentage: scalePercentage,
        presetId: selectedPresetId,
      };

      const optOpts: OptimizationOptions = {
        maxColors,
        frameSkip,
        dither,
        speedMultiplier,
      };

      const result = await encodeOptimizedGif(decodedGif, resizeOpts, optOpts, (p) => {
        setProgressPct(p);
      });

      setResultGif(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Encoding failed.');
    } finally {
      setIsLoading(false);
      setProgressPct(0);
      setStatusMessage('');
    }
  };

  // Animation player loop for original canvas
  useEffect(() => {
    if (!decodedGif || !isPlaying || decodedGif.frames.length === 0) return;

    let timeoutId: any;
    const currentFrame = decodedGif.frames[currentFrameIdx] || decodedGif.frames[0];
    const delay = currentFrame.delayMs || 100;

    timeoutId = setTimeout(() => {
      setCurrentFrameIdx((prev) => (prev + 1) % decodedGif.frames.length);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [decodedGif, isPlaying, currentFrameIdx]);

  // Render current frame to original preview canvas
  useEffect(() => {
    if (!decodedGif || !originalCanvasRef.current) return;
    const canvas = originalCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frame = decodedGif.frames[currentFrameIdx];
    if (!frame) return;

    canvas.width = decodedGif.width;
    canvas.height = decodedGif.height;

    const imgData = new ImageData(
      new Uint8ClampedArray(frame.rgbaData.buffer, frame.rgbaData.byteOffset, frame.rgbaData.byteLength),
      decodedGif.width,
      decodedGif.height
    );
    ctx.putImageData(imgData, 0, 0);
  }, [decodedGif, currentFrameIdx]);

  // Copy GIF to clipboard
  const handleCopyClipboard = async () => {
    if (!resultGif) return;
    try {
      if (navigator.clipboard && (window as any).ClipboardItem) {
        const item = new (window as any).ClipboardItem({ 'image/gif': resultGif.blob });
        await navigator.clipboard.write([item]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      } else {
        alert(t.copyError);
      }
    } catch (e) {
      console.warn('Clipboard write failed, falling back to download', e);
      alert(t.copyError);
    }
  };

  // Download optimized GIF
  const handleDownload = () => {
    if (!resultGif) return;
    const a = document.createElement('a');
    a.href = resultGif.blobUrl;
    const baseName = decodedGif?.originalFileName?.replace(/\.gif$/i, '') || 'optimized';
    a.download = `${baseName}_reduced.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Calculate size reduction statistics
  const originalSize = decodedGif?.originalFileSizeBytes || 0;
  const newSize = resultGif?.fileSizeBytes || 0;
  const bytesSaved = Math.max(0, originalSize - newSize);
  const reductionPercentage = originalSize > 0 ? Math.round((bytesSaved / originalSize) * 100) : 0;

  return (
    <div id="tool-workspace" className="w-full max-w-6xl mx-auto space-y-8">
      {/* Upload Zone (If no GIF loaded) */}
      {!decodedGif && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="relative rounded-3xl border-2 border-dashed border-border hover:border-primary/60 bg-card/80 backdrop-blur-xl p-8 sm:p-14 text-center transition-all duration-300 shadow-xl group cursor-pointer"
        >
          <input
            type="file"
            accept="image/gif"
            onChange={(e) => e.target.files?.[0] && handleFileLoad(e.target.files[0], e.target.files[0].name)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            aria-label={t.dropzoneTitle}
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t.dropzoneTitle}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t.dropzoneSub}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/40 border border-border text-[11px] text-muted-foreground font-mono">
              <span>{t.dropzonePasteHint}</span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition transform active:scale-98"
              >
                {t.uploadBtn}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSample();
                }}
                className="w-full sm:w-auto relative z-20 px-5 py-3 rounded-xl border border-border bg-muted/30 hover:bg-muted text-foreground font-medium text-sm transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-cyan-glow" />
                <span>{t.loadSampleBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress & Status Overlay */}
      {isLoading && (
        <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-md p-6 text-center space-y-3 shadow-lg animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <span className="font-semibold text-sm text-foreground">{statusMessage}</span>
          </div>
          {progressPct > 0 && (
            <div className="max-w-md mx-auto space-y-1">
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">
                {progressPct}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
          <span className="font-bold">{t.errorTitle}:</span>
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="ml-auto text-xs underline font-medium"
          >
            닫기
          </button>
        </div>
      )}

      {/* Main Interactive Studio (When GIF is loaded) */}
      {decodedGif && (
        <div className="space-y-6">
          {/* Top Control Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <FileImage className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-foreground truncate max-w-xs sm:max-w-md">
                  {decodedGif.originalFileName}
                </div>
                <div className="text-xs text-muted-foreground font-mono tabular-nums">
                  {decodedGif.width}×{decodedGif.height} px · {decodedGif.frames.length} frames · {formatBytes(decodedGif.originalFileSizeBytes)}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setDecodedGif(null);
                setResultGif(null);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-xs text-muted-foreground hover:text-foreground font-medium transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.btnReset}</span>
            </button>
          </div>

          {/* Dual Layout: Left Settings Studio, Right Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Controls Column (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl border border-border bg-card shadow-lg p-5 sm:p-6 space-y-6">
              
              {/* Navigation Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted/40 border border-border text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('resize')}
                  className={`py-2 px-2.5 rounded-lg transition text-center flex items-center justify-center gap-1.5 ${
                    activeTab === 'resize'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="truncate">{t.tabResize}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('compress')}
                  className={`py-2 px-2.5 rounded-lg transition text-center flex items-center justify-center gap-1.5 ${
                    activeTab === 'compress'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span className="truncate">{t.tabCompress}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('speed')}
                  className={`py-2 px-2.5 rounded-lg transition text-center flex items-center justify-center gap-1.5 ${
                    activeTab === 'speed'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span className="truncate">{t.tabSpeed}</span>
                </button>
              </div>

              {/* Tab 1: Dimensions & Presets */}
              {activeTab === 'resize' && (
                <div className="space-y-5">
                  {/* Mode Selector */}
                  <div className="flex rounded-xl border border-border p-1 bg-muted/20 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setResizeMode('dimensions')}
                      className={`flex-1 py-1.5 rounded-lg transition ${
                        resizeMode === 'dimensions' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground'
                      }`}
                    >
                      {t.modeDimensions}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResizeMode('percentage')}
                      className={`flex-1 py-1.5 rounded-lg transition ${
                        resizeMode === 'percentage' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground'
                      }`}
                    >
                      {t.modePercentage}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResizeMode('preset')}
                      className={`flex-1 py-1.5 rounded-lg transition ${
                        resizeMode === 'preset' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground'
                      }`}
                    >
                      {t.modePreset}
                    </button>
                  </div>

                  {/* Mode A: Custom Pixels */}
                  {resizeMode === 'dimensions' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 items-end">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                            <span>{t.widthLabel}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">px</span>
                          </label>
                          <input
                            type="number"
                            min="16"
                            max="3840"
                            value={width}
                            onChange={(e) => handleWidthChange(parseInt(e.target.value) || 16)}
                            className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground font-mono tabular-nums text-sm focus:ring-2 focus:ring-primary/40 outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                            <span>{t.heightLabel}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">px</span>
                          </label>
                          <input
                            type="number"
                            min="16"
                            max="3840"
                            value={height}
                            onChange={(e) => handleHeightChange(parseInt(e.target.value) || 16)}
                            className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground font-mono tabular-nums text-sm focus:ring-2 focus:ring-primary/40 outline-none"
                          />
                        </div>
                      </div>

                      {/* Aspect Ratio Lock Button */}
                      <button
                        type="button"
                        onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                        className={`w-full py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition ${
                          aspectRatioLocked
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border bg-muted/20 text-muted-foreground'
                        }`}
                      >
                        {aspectRatioLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{aspectRatioLocked ? t.lockAspect : t.unlockAspect}</span>
                      </button>

                      {/* Quick Dimension Step Presets */}
                      <div className="flex gap-2">
                        {[0.25, 0.5, 0.75].map((factor) => {
                          const w = Math.round(decodedGif.width * factor);
                          const h = Math.round(decodedGif.height * factor);
                          return (
                            <button
                              key={factor}
                              type="button"
                              onClick={() => {
                                setWidth(w);
                                setHeight(h);
                              }}
                              className="flex-1 py-1.5 rounded-lg border border-border bg-muted/10 hover:bg-muted/30 text-[11px] font-mono text-muted-foreground transition"
                            >
                              {w}×{h}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mode B: Percentage Scale */}
                  {resizeMode === 'percentage' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">{t.percentageLabel}</span>
                        <span className="font-mono font-bold text-primary text-sm">{scalePercentage}%</span>
                      </div>

                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={scalePercentage}
                        onChange={(e) => handlePercentageChange(parseInt(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />

                      <div className="grid grid-cols-4 gap-2 text-xs">
                        {[25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handlePercentageChange(pct)}
                            className={`py-1.5 rounded-lg border text-xs font-mono transition ${
                              scalePercentage === pct
                                ? 'border-primary bg-primary/10 text-primary font-bold'
                                : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>

                      <div className="p-3 rounded-xl border border-border bg-muted/20 text-xs font-mono flex items-center justify-between text-muted-foreground">
                        <span>결과 크기:</span>
                        <span className="text-foreground font-bold">{width}×{height} px</span>
                      </div>
                    </div>
                  )}

                  {/* Mode C: Platform Presets */}
                  {resizeMode === 'preset' && (
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground font-medium">
                        {t.selectPresetPrompt}
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {PLATFORM_PRESETS.map((p) => {
                          const isSelected = selectedPresetId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => applyPreset(p)}
                              className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                                isSelected
                                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                                  : 'border-border bg-muted/10 hover:bg-muted/30'
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-foreground truncate">
                                    {lang === 'ko' ? p.nameKo : p.nameEn}
                                  </span>
                                  {p.badge && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-cyan-glow/15 text-cyan-glow text-[10px] font-bold">
                                      {p.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  {p.width}×{p.height} px · 최대 {p.maxSizeMb}MB
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Compression & Palette */}
              {activeTab === 'compress' && (
                <div className="space-y-5">
                  {/* Palette Reduction */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                      <span>{t.paletteLabel}</span>
                      <span className="font-mono text-primary font-bold">{maxColors} Colors</span>
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {([256, 128, 64, 32, 16] as PaletteColors[]).map((colors) => (
                        <button
                          key={colors}
                          type="button"
                          onClick={() => setMaxColors(colors)}
                          className={`py-2 px-2 rounded-xl border text-xs font-mono transition ${
                            maxColors === colors
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                              : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {colors} 색상
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t.paletteDesc}
                    </p>
                  </div>

                  {/* Frame Skipping / Subsampling */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                      <span>{t.frameSkipLabel}</span>
                    </label>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setFrameSkip(1)}
                        className={`w-full p-2.5 rounded-xl border text-xs text-left transition flex items-center justify-between ${
                          frameSkip === 1 ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-muted/10 text-muted-foreground'
                        }`}
                      >
                        <span>{t.frameSkipAll}</span>
                        <span className="font-mono text-[10px]">100%</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFrameSkip(2)}
                        className={`w-full p-2.5 rounded-xl border text-xs text-left transition flex items-center justify-between ${
                          frameSkip === 2 ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-muted/10 text-muted-foreground'
                        }`}
                      >
                        <span>{t.frameSkip2}</span>
                        <span className="font-mono text-[10px] text-emerald-500 font-bold">-50%</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFrameSkip(3)}
                        className={`w-full p-2.5 rounded-xl border text-xs text-left transition flex items-center justify-between ${
                          frameSkip === 3 ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-muted/10 text-muted-foreground'
                        }`}
                      >
                        <span>{t.frameSkip3}</span>
                        <span className="font-mono text-[10px] text-emerald-500 font-bold">-66%</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t.frameSkipDesc}
                    </p>
                  </div>

                  {/* Dither Toggle */}
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-foreground">{t.ditherLabel}</div>
                      <div className="text-[11px] text-muted-foreground">{t.ditherDesc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={dither}
                      onChange={(e) => setDither(e.target.checked)}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Speed & Duration */}
              {activeTab === 'speed' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">{t.speedLabel}</span>
                    <span className="font-mono font-bold text-primary text-sm">{speedMultiplier}x</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSpeedMultiplier(s)}
                        className={`py-2 rounded-xl border text-xs font-mono transition ${
                          speedMultiplier === s
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                            : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between font-mono">
                      <span>예상 총 재생 시간:</span>
                      <span className="text-foreground font-bold">
                        {Math.round(decodedGif.totalDurationMs / speedMultiplier)} ms
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Apply Changes CTA */}
              <button
                type="button"
                onClick={handleApplyChanges}
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/25 hover:bg-primary/90 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{resultGif ? t.btnReapply : t.btnApply}</span>
              </button>
            </div>

            {/* Right Live Preview Column (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Split Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Original GIF Preview */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3 flex flex-col shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider">
                      {t.previewOriginal}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {decodedGif.width}×{decodedGif.height} px
                    </span>
                  </div>

                  <div className="flex-1 min-h-[220px] max-h-[280px] rounded-xl border border-border bg-muted/30 flex items-center justify-center p-2 relative overflow-hidden checkerboard-bg">
                    <canvas
                      ref={originalCanvasRef}
                      className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">{t.fileSize}:</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {formatBytes(decodedGif.originalFileSizeBytes)}
                    </span>
                  </div>
                </div>

                {/* 2. Optimized GIF Preview */}
                <div className="rounded-2xl border-2 border-primary/40 bg-card p-4 space-y-3 flex flex-col shadow-md relative">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.previewOptimized}</span>
                    </span>
                    {resultGif && (
                      <span className="font-mono text-[11px] text-primary font-bold tabular-nums">
                        {resultGif.width}×{resultGif.height} px
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-h-[220px] max-h-[280px] rounded-xl border border-border bg-muted/30 flex items-center justify-center p-2 relative overflow-hidden checkerboard-bg">
                    {resultGif ? (
                      <img
                        src={resultGif.blobUrl}
                        alt="Optimized GIF result"
                        className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground text-center space-y-2">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                        <div>결과 미리보기 생성 중...</div>
                      </div>
                    )}

                    {/* Reduction Badge Overlay */}
                    {reductionPercentage > 0 && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500 text-white font-mono font-black text-xs shadow-md">
                        -{reductionPercentage}%
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-between text-xs font-mono">
                    <span className="text-primary font-semibold">{t.fileSize}:</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {resultGif ? formatBytes(resultGif.fileSizeBytes) : '...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Playback Control Bar & Scrubber */}
              <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-9 h-9 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition"
                      title={isPlaying ? t.pause : t.play}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <span className="text-xs font-mono text-muted-foreground tabular-nums">
                      {t.frameIndicator} {currentFrameIdx + 1} / {decodedGif.frames.length}
                    </span>
                  </div>

                  {resultGif && (
                    <div className="text-xs font-mono text-muted-foreground">
                      <span>처리 시간: </span>
                      <span className="text-foreground font-semibold">{resultGif.processingTimeMs}ms</span>
                    </div>
                  )}
                </div>

                {/* Scrubber slider */}
                <input
                  type="range"
                  min="0"
                  max={decodedGif.frames.length - 1}
                  value={currentFrameIdx}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentFrameIdx(parseInt(e.target.value));
                  }}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Final Export & Action Panel */}
              {resultGif && (
                <div className="p-5 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-lg space-y-4">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl border border-border bg-muted/20">
                      <div className="text-[10px] text-muted-foreground">{t.statOriginalSize}</div>
                      <div className="font-mono font-bold text-foreground tabular-nums">
                        {formatBytes(decodedGif.originalFileSizeBytes)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-border bg-muted/20">
                      <div className="text-[10px] text-muted-foreground">{t.statNewSize}</div>
                      <div className="font-mono font-bold text-primary tabular-nums">
                        {formatBytes(resultGif.fileSizeBytes)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{t.statSaved}</div>
                      <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        -{reductionPercentage}% ({formatBytes(bytesSaved)})
                      </div>
                    </div>
                  </div>

                  {/* Primary Download & Copy Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex-1 py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/95 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t.btnDownload}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyClipboard}
                      className="py-3.5 px-5 rounded-xl border border-border bg-muted/30 hover:bg-muted text-foreground font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {copySuccess ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>{copySuccess ? t.copySuccess : t.btnCopy}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
