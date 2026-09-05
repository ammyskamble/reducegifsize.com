// src/utils/gifEngine.ts
import * as omggifModule from 'omggif';
import * as gifencModule from 'gifenc';
import type {
  DecodedGif,
  DecodedGifFrame,
  ResizeOptions,
  OptimizationOptions,
  EncodedGifResult,
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
 * Resizes and optimizes an animated GIF using client-side Canvas and gifenc.
 */
export async function encodeOptimizedGif(
  decodedGif: DecodedGif,
  resizeOpts: ResizeOptions,
  optOpts: OptimizationOptions,
  onProgress?: (progress0to100: number) => void
): Promise<EncodedGifResult> {
  const startTime = performance.now();
  const { frames } = decodedGif;

  const targetW = Math.max(16, Math.round(resizeOpts.targetWidth));
  const targetH = Math.max(16, Math.round(resizeOpts.targetHeight));
  const frameSkip = optOpts.frameSkip || 1;
  const maxColors = optOpts.maxColors || 256;
  const speedMultiplier = optOpts.speedMultiplier || 1.0;

  interface TargetFrame {
    rgba: Uint8ClampedArray;
    delayMs: number;
  }

  const framesToEncode: TargetFrame[] = [];
  let accumulatedDelay = 0;

  for (let i = 0; i < frames.length; i++) {
    accumulatedDelay += frames[i].delayMs;
    const isKeyFrame = i % frameSkip === 0 || i === frames.length - 1;

    if (isKeyFrame) {
      const finalDelay = Math.max(20, Math.round(accumulatedDelay / speedMultiplier));
      framesToEncode.push({
        rgba: frames[i].rgbaData,
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

    const format = hasTransparentPixels ? 'rgba4444' : 'rgb565';

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
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2 + Math.cos(angle) * 70;
    const cy = height / 2 + Math.sin(angle * 2) * 50;
    const radGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 65);
    radGrad.addColorStop(0, '#38bdf8');
    radGrad.addColorStop(0.5, '#6366f1');
    radGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Reduce GIF Size', width / 2, height / 2 - 15);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText(`Frame ${i + 1} / ${totalFrames}`, width / 2, height / 2 + 20);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('한국어 GIF 용량 줄이기 데모', width / 2, height / 2 + 50);

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
