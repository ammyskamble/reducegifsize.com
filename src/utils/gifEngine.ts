// src/utils/gifEngine.ts
import * as omggifModule from 'omggif';
import * as gifencModule from 'gifenc';
import type {
  DecodedGif,
  DecodedGifFrame,
  ResizeOptions,
  OptimizationOptions,
  EncodedGifResult,
  PaletteColors,
  FrameSkipMode,
  ColorFormat,
} from '../types';

function createGifReader(bytes: Uint8Array) {
  const pkg: any = omggifModule;
  const Reader =
    pkg.GifReader ||
    pkg.default?.GifReader ||
    (typeof pkg.default === 'function' ? pkg.default : null) ||
    (typeof pkg === 'function' ? pkg : null);
  if (typeof Reader !== 'function') {
    throw new Error('Could not resolve GifReader constructor');
  }
  return new Reader(bytes);
}

function createGifEncoder() {
  const pkg: any = gifencModule;
  const Encoder =
    pkg.GIFEncoder ||
    pkg.default?.GIFEncoder ||
    (typeof pkg.default === 'function' ? pkg.default : null) ||
    (typeof pkg === 'function' ? pkg : null);
  if (typeof Encoder !== 'function') {
    throw new Error('Could not resolve GIFEncoder');
  }
  return Encoder();
}

function quantizeColors(rgba: Uint8Array, maxColors: number, opts: any) {
  const pkg: any = gifencModule;
  const fn = pkg.quantize || pkg.default?.quantize;
  if (typeof fn !== 'function') {
    throw new Error('Could not resolve quantize function');
  }
  return fn(rgba, maxColors, opts);
}

function applyPaletteToFrame(rgba: Uint8Array, palette: any, format: string) {
  const pkg: any = gifencModule;
  const fn = pkg.applyPalette || pkg.default?.applyPalette;
  if (typeof fn !== 'function') {
    throw new Error('Could not resolve applyPalette function');
  }
  return fn(rgba, palette, format);
}

/**
 * Decodes an animated GIF ArrayBuffer into full RGBA frame composites.
 */
export async function decodeGif(
  arrayBuffer: ArrayBuffer,
  fileName: string = 'animation.gif'
): Promise<DecodedGif> {
  const bytes = new Uint8Array(arrayBuffer);
  const reader = createGifReader(bytes);

  const totalFrames = reader.numFrames();
  const width = reader.width;
  const height = reader.height;

  if (totalFrames <= 0) {
    throw new Error('No frames found in GIF file.');
  }

  // Composite canvas for progressive frame rendering
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // Backup canvas for disposal method 3 (restore to previous)
  const backupCanvas = document.createElement('canvas');
  backupCanvas.width = width;
  backupCanvas.height = height;
  const backupCtx = backupCanvas.getContext('2d', { willReadFrequently: true })!;

  // Frame buffer for blitting frame sub-rectangles from omggif
  const frameImageData = ctx.createImageData(width, height);
  const framePixels = frameImageData.data;

  const decodedFrames: DecodedGifFrame[] = [];
  let totalDurationMs = 0;

  for (let i = 0; i < totalFrames; i++) {
    const info = reader.frameInfo(i);
    // omggif delay is in 10ms units (hundredths of a second). Standard fallback is 100ms if delay <= 1.
    const rawDelay = info.delay ?? 10;
    const delayMs = (rawDelay <= 1 ? 10 : rawDelay) * 10;
    totalDurationMs += delayMs;

    // Save backup if disposal is 3
    if (info.disposal === 3) {
      backupCtx.clearRect(0, 0, width, height);
      backupCtx.drawImage(canvas, 0, 0);
    }

    // Decode this frame's pixels into framePixels
    framePixels.fill(0);
    reader.decodeAndBlitFrameRGBA(i, framePixels);

    // Create an offscreen temporary image bitmap from framePixels to composite onto canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(frameImageData, 0, 0);

    // Draw onto composite canvas
    ctx.drawImage(tempCanvas, 0, 0);

    // Capture the current full composite RGBA frame
    const compositeImgData = ctx.getImageData(0, 0, width, height);
    const fullFrameCopy = new Uint8ClampedArray(compositeImgData.data);

    // Check transparency
    let hasTransparency = false;
    for (let p = 3; p < fullFrameCopy.length; p += 4) {
      if (fullFrameCopy[p] < 255) {
        hasTransparency = true;
        break;
      }
    }

    decodedFrames.push({
      index: i,
      width,
      height,
      x: info.x ?? 0,
      y: info.y ?? 0,
      delayMs,
      disposal: info.disposal ?? 0,
      hasTransparency,
      rgbaData: fullFrameCopy,
    });

    // Handle disposal for subsequent frame
    if (info.disposal === 2) {
      // Restore to background / clear this frame's bounding rect
      ctx.clearRect(info.x, info.y, info.width, info.height);
    } else if (info.disposal === 3) {
      // Restore previous state
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(backupCanvas, 0, 0);
    }
  }

  const avgFps = totalFrames > 0 && totalDurationMs > 0 ? totalFrames / (totalDurationMs / 1000) : 10;

  return {
    width,
    height,
    totalDurationMs,
    fps: Math.round(avgFps * 10) / 10,
    frames: decodedFrames,
    originalFileSizeBytes: bytes.byteLength,
    originalFileName: fileName,
  };
}

/**
 * Resizes, trims, and optimizes an animated GIF using client-side Canvas and gifenc.
 */
export async function encodeOptimizedGif(
  decodedGif: DecodedGif,
  resizeOpts: ResizeOptions,
  optOpts: OptimizationOptions,
  onProgress?: (progress0to100: number) => void
): Promise<EncodedGifResult> {
  const startTime = performance.now();
  let sourceFrames = [...decodedGif.frames];

  // 1. Frame Trimming (Trim Start / End)
  const trimStart = Math.max(0, Math.min(optOpts.trimStartFrame ?? 0, sourceFrames.length - 1));
  const trimEnd = Math.max(trimStart, Math.min(optOpts.trimEndFrame ?? (sourceFrames.length - 1), sourceFrames.length - 1));
  sourceFrames = sourceFrames.slice(trimStart, trimEnd + 1);

  if (sourceFrames.length === 0) {
    sourceFrames = [decodedGif.frames[0]];
  }

  // 2. Reverse Animation (if enabled)
  if (optOpts.reverseAnimation) {
    sourceFrames.reverse();
  }

  const targetW = Math.max(16, Math.round(resizeOpts.targetWidth));
  const targetH = Math.max(16, Math.round(resizeOpts.targetHeight));
  const frameSkip = Math.max(1, optOpts.frameSkip || 1);
  const maxColors = optOpts.maxColors || 128;
  const speedMultiplier = optOpts.speedMultiplier || 1.0;
  const requestedFormat = optOpts.colorFormat || 'rgb565';

  interface TargetFrame {
    rgba: Uint8ClampedArray;
    delayMs: number;
  }

  const framesToEncode: TargetFrame[] = [];
  let accumulatedDelay = 0;

  // 3. Subsampling with cumulative duration preservation
  for (let i = 0; i < sourceFrames.length; i++) {
    accumulatedDelay += sourceFrames[i].delayMs;
    const isKeyFrame = i % frameSkip === 0 || i === sourceFrames.length - 1;

    if (isKeyFrame) {
      const finalDelay = Math.max(20, Math.round(accumulatedDelay / speedMultiplier));
      framesToEncode.push({
        rgba: sourceFrames[i].rgbaData,
        delayMs: finalDelay,
      });
      accumulatedDelay = 0;
    }
  }

  const scaleCanvas = document.createElement('canvas');
  scaleCanvas.width = targetW;
  scaleCanvas.height = targetH;
  const scaleCtx = scaleCanvas.getContext('2d', { willReadFrequently: true })!;
  scaleCtx.imageSmoothingEnabled = true;
  scaleCtx.imageSmoothingQuality = 'high';

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = decodedGif.width;
  srcCanvas.height = decodedGif.height;
  const srcCtx = srcCanvas.getContext('2d')!;

  const gifEncoder = createGifEncoder();
  const totalToProcess = framesToEncode.length;

  for (let idx = 0; idx < totalToProcess; idx++) {
    const item = framesToEncode[idx];

    const srcImgData = new ImageData(
      new Uint8ClampedArray(item.rgba.buffer, item.rgba.byteOffset, item.rgba.byteLength),
      decodedGif.width,
      decodedGif.height
    );
    srcCtx.putImageData(srcImgData, 0, 0);

    scaleCtx.clearRect(0, 0, targetW, targetH);
    scaleCtx.drawImage(srcCanvas, 0, 0, targetW, targetH);

    const scaledImgData = scaleCtx.getImageData(0, 0, targetW, targetH);
    const scaledRgba = new Uint8Array(scaledImgData.data.buffer);

    let hasTransparentPixels = false;
    for (let p = 3; p < scaledRgba.length; p += 4) {
      if (scaledRgba[p] < 128) {
        hasTransparentPixels = true;
        break;
      }
    }

    // Format selection
    const format = hasTransparentPixels || requestedFormat === 'rgba4444'
      ? 'rgba4444'
      : requestedFormat;

    const palette = quantizeColors(scaledRgba, maxColors, {
      format,
      clearAlpha: hasTransparentPixels,
      clearAlphaThreshold: 128,
    });

    const index = applyPaletteToFrame(scaledRgba, palette, format);

    let transparentIndex = 0;
    if (hasTransparentPixels) {
      for (let i = 0; i < palette.length; i++) {
        if (palette[i] === 0) {
          transparentIndex = i;
          break;
        }
      }
    }

    gifEncoder.writeFrame(index, targetW, targetH, {
      palette,
      delay: item.delayMs,
      transparent: hasTransparentPixels,
      transparentIndex: hasTransparentPixels ? transparentIndex : 0,
      repeat: 0,
    });

    if (onProgress) {
      const pct = Math.min(99, Math.round(((idx + 1) / totalToProcess) * 100));
      onProgress(pct);
    }

    if (idx % 2 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  gifEncoder.finish();
  const encodedBytes = gifEncoder.bytes();
  const blob = new Blob([encodedBytes], { type: 'image/gif' });
  const blobUrl = URL.createObjectURL(blob);

  if (onProgress) {
    onProgress(100);
  }

  const processingTimeMs = Math.round(performance.now() - startTime);

  let totalDurationMs = 0;
  framesToEncode.forEach((f) => (totalDurationMs += f.delayMs));
  const finalFps = totalToProcess > 0 && totalDurationMs > 0 ? totalToProcess / (totalDurationMs / 1000) : 10;

  return {
    blob,
    blobUrl,
    fileSizeBytes: blob.size,
    width: targetW,
    height: targetH,
    totalFrames: totalToProcess,
    fps: Math.round(finalFps * 10) / 10,
    processingTimeMs,
  };
}

/**
 * Smart Solver: Calculates optimal settings to hit a target file size (e.g. Discord 256KB, 512KB, 10MB)
 */
export function calculateOptimalTargetSettings(
  decodedGif: DecodedGif,
  targetBytes: number
): {
  targetWidth: number;
  targetHeight: number;
  percentage: number;
  maxColors: PaletteColors;
  frameSkip: FrameSkipMode;
  colorFormat: ColorFormat;
} {
  const currentBytes = decodedGif.originalFileSizeBytes;
  const ratio = targetBytes / currentBytes;
  const origW = decodedGif.width;
  const origH = decodedGif.height;

  // If file is already smaller than target, gentle compression
  if (ratio >= 1) {
    return {
      targetWidth: origW,
      targetHeight: origH,
      percentage: 100,
      maxColors: 256,
      frameSkip: 1,
      colorFormat: 'rgb565',
    };
  }

  // Extreme compression needed (e.g. Discord Emoji 256KB or Sticker 512KB)
  if (ratio < 0.15 || targetBytes <= 262144) {
    // Cap dimensions to 128px if targeting 256KB or less
    const maxDim = targetBytes <= 262144 ? 128 : 320;
    const scale = Math.min(1, maxDim / Math.max(origW, origH));
    const targetW = Math.max(32, Math.round(origW * scale));
    const targetH = Math.max(32, Math.round(origH * scale));

    return {
      targetWidth: targetW,
      targetHeight: targetH,
      percentage: Math.max(10, Math.round(scale * 100)),
      maxColors: 64,
      frameSkip: 2,
      colorFormat: 'rgba4444',
    };
  }

  // Aggressive compression (ratio 0.15 - 0.40)
  if (ratio < 0.4) {
    const scale = Math.max(0.4, Math.sqrt(ratio * 1.3));
    const targetW = Math.max(120, Math.round(origW * scale));
    const targetH = Math.max(120, Math.round(origH * scale));
    return {
      targetWidth: targetW,
      targetHeight: targetH,
      percentage: Math.round(scale * 100),
      maxColors: 96,
      frameSkip: 2,
      colorFormat: 'rgb565',
    };
  }

  // Moderate compression (ratio 0.40 - 0.75)
  if (ratio < 0.75) {
    const scale = Math.max(0.65, Math.sqrt(ratio * 1.15));
    const targetW = Math.max(200, Math.round(origW * scale));
    const targetH = Math.max(200, Math.round(origH * scale));
    return {
      targetWidth: targetW,
      targetHeight: targetH,
      percentage: Math.round(scale * 100),
      maxColors: 128,
      frameSkip: 1,
      colorFormat: 'rgb565',
    };
  }

  // Light compression (ratio 0.75 - 0.99)
  const scale = Math.max(0.85, Math.sqrt(ratio));
  return {
    targetWidth: Math.round(origW * scale),
    targetHeight: Math.round(origH * scale),
    percentage: Math.round(scale * 100),
    maxColors: 192,
    frameSkip: 1,
    colorFormat: 'rgb565',
  };
}

/**
 * Creates a colorful bouncing sample animated GIF in-memory for zero-friction testing.
 */
export async function createSampleGif(): Promise<ArrayBuffer> {
  const width = 360;
  const height = 360;
  const totalFrames = 18;
  const gif = createGifEncoder();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  for (let i = 0; i < totalFrames; i++) {
    const progress = i / totalFrames;
    const angle = progress * Math.PI * 2;

    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#131b2e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ambient glow circles
    const cx = width / 2 + Math.cos(angle) * 70;
    const cy = height / 2 + Math.sin(angle * 2) * 50;
    const radGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 75);
    radGrad.addColorStop(0, '#38bdf8');
    radGrad.addColorStop(0.5, '#6366f1');
    radGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 75, 0, Math.PI * 2);
    ctx.fill();

    // Center pulsating core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    // High contrast typography
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GifResizetool.com', width / 2, height / 2 - 18);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText(`Frame ${i + 1} / ${totalFrames}`, width / 2, height / 2 + 18);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Ultra-fast GIF Engine Demo', width / 2, height / 2 + 48);

    const imgData = ctx.getImageData(0, 0, width, height);
    const rgba = new Uint8Array(imgData.data.buffer);
    const palette = quantizeColors(rgba, 128, { format: 'rgb565' });
    const index = applyPaletteToFrame(rgba, palette, 'rgb565');

    gif.writeFrame(index, width, height, {
      palette,
      delay: 70,
      repeat: 0,
    });
  }

  gif.finish();
  const bytes = gif.bytes();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/**
 * Format bytes into human-readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
