// src/types/index.ts

export type Language = 'ko' | 'en';

export interface DecodedGifFrame {
  index: number;
  width: number;
  height: number;
  x: number;
  y: number;
  delayMs: number;
  disposal: number;
  hasTransparency: boolean;
  rgbaData: Uint8ClampedArray; // Full canvas RGBA composite
}

export interface DecodedGif {
  width: number;
  height: number;
  totalDurationMs: number;
  fps: number;
  frames: DecodedGifFrame[];
  originalFileSizeBytes: number;
  originalFileName: string;
}

export type ResizeMode = 'dimensions' | 'percentage' | 'preset' | 'target';

export interface ResizeOptions {
  mode: ResizeMode;
  targetWidth: number;
  targetHeight: number;
  keepAspectRatio: boolean;
  percentage: number;
  presetId?: string;
  targetSizeKb?: number;
}

export type PaletteColors = 256 | 192 | 128 | 96 | 64 | 32 | 16;
export type FrameSkipMode = 1 | 2 | 3 | 4; // 1: Keep all (100%), 2: Drop 1 in 2 (50%), 3: Keep 1 in 3 (33%), 4: Keep 1 in 4 (25%)
export type ColorFormat = 'rgb565' | 'rgb444' | 'rgba4444';

export interface OptimizationOptions {
  maxColors: PaletteColors;
  frameSkip: FrameSkipMode;
  colorFormat: ColorFormat;
  dither: boolean;
  speedMultiplier: number; // 0.5, 0.75, 1, 1.25, 1.5, 2
  reverseAnimation?: boolean;
  trimStartFrame?: number;
  trimEndFrame?: number;
}

export interface EncodedGifResult {
  blob: Blob;
  blobUrl: string;
  fileSizeBytes: number;
  width: number;
  height: number;
  totalFrames: number;
  fps: number;
  processingTimeMs: number;
}

export interface PlatformPreset {
  id: string;
  category: 'discord' | 'korea' | 'social' | 'web';
  nameKo: string;
  nameEn: string;
  platformKo: string;
  platformEn: string;
  width?: number;
  height?: number;
  maxSizeMb?: number;
  maxSizeKb?: number;
  recommendedColors?: PaletteColors;
  recommendedSkip?: FrameSkipMode;
  recommendedFormat?: ColorFormat;
  descriptionKo: string;
  descriptionEn: string;
  badge?: string;
}

export type ComparisonMode = 'split' | 'side' | 'single';
