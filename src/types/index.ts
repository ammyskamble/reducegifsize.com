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

export type ResizeMode = 'dimensions' | 'percentage' | 'preset';

export interface ResizeOptions {
  mode: ResizeMode;
  targetWidth: number;
  targetHeight: number;
  keepAspectRatio: boolean;
  percentage: number;
  presetId?: string;
}

export type PaletteColors = 256 | 128 | 64 | 32 | 16;
export type FrameSkipMode = 1 | 2 | 3; // 1: Keep all (100%), 2: Skip every 2nd (50%), 3: Keep 1 in 3 (33%)

export interface OptimizationOptions {
  maxColors: PaletteColors;
  frameSkip: FrameSkipMode;
  dither: boolean;
  speedMultiplier: number; // 0.5, 1, 1.25, 1.5, 2
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
  category: 'korea' | 'social' | 'web';
  nameKo: string;
  nameEn: string;
  platformKo: string;
  platformEn: string;
  width?: number;
  height?: number;
  maxSizeMb?: number;
  recommendedColors?: PaletteColors;
  recommendedSkip?: FrameSkipMode;
  descriptionKo: string;
  descriptionEn: string;
  badge?: string;
}
