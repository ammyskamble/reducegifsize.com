// src/data/i18n.ts
import type { Language } from '../types';

export const translations = {
  ko: {
    // Header & Brand
    brandName: 'Reduce GIF Size',
    brandSub: 'GIF 용량 줄이기',
    navTool: '리사이저 툴',
    navPresets: '플랫폼 규격',
    navGuide: '최적화 가이드',
    navFaq: '자주 묻는 질문',
    privacyBadge: '100% 브라우저 내 처리 · 서버 전송 없음',

    // Hero
    heroTitlePrefix: '초고속 온라인',
    heroTitleHighlight: 'GIF 용량 줄이기',
    heroTitleSuffix: '& 크기 조절',
    heroDesc:
      '서버 업로드 없이 브라우저 내에서 즉시 움짤의 해상도 조절, 프레임 최적화, 256 색상 압축을 수행합니다. 카카오톡, 디시인사이드, 네이버 블로그 업로드 용량 제한을 한 번에 해결하세요.',

    // Dropzone
    dropzoneTitle: 'GIF 파일을 여기로 드래그하거나 클릭하여 업로드',
    dropzoneSub: '애니메이션 GIF 파일 지원 (최대 50MB 권장) · 100% 안전한 로컬 처리',
    dropzonePasteHint: '클립보드(Ctrl+V) 붙여넣기 지원',
    loadSampleBtn: '샘플 움짤로 체험하기',
    uploadBtn: 'GIF 파일 선택',

    // Status & Feedback
    decoding: 'GIF 프레임 분석 및 디코딩 중...',
    encoding: '최적화 및 GIF 인코딩 중...',
    processingProgress: '처리 진행률',
    cancelling: '취소 중...',
    errorTitle: '오류 발생',

    // Tool Workspace Tabs
    tabResize: '해상도 / 크기 조절',
    tabCompress: '용량 압축 & 색상',
    tabSpeed: '속도 & 프레임',

    // Dimension Controls
    modeDimensions: '직접 입력 (px)',
    modePercentage: '비율 조절 (%)',
    modePreset: '플랫폼 프리셋',
    widthLabel: '가로 너비',
    heightLabel: '세로 높이',
    lockAspect: '비율 유지',
    unlockAspect: '비율 해제',
    percentageLabel: '축소 비율',

    // Preset Controls
    selectPresetPrompt: '플랫폼을 선택하면 권장 크기와 압축률이 자동 적용됩니다:',
    categoryKorea: '국내 플랫폼 (카카오/디시/네이버)',
    categorySocial: '글로벌 소셜 (X/인스타/디스코드)',
    categoryWeb: '웹 배너 규격',

    // Compression Controls
    paletteLabel: '색상 수 (컬러 팔레트)',
    colors256: '256 색상 (최고 화질)',
    colors128: '128 색상 (균형 권장)',
    colors64: '64 색상 (높은 압축률)',
    colors32: '32 색상 (최대 압축)',
    colors16: '16 색상 (초경량)',
    paletteDesc: '색상 수를 줄이면 GIF 파일 용량이 30%~70% 대폭 감소합니다.',

    frameSkipLabel: '프레임 최적화 (프레임 스킵)',
    frameSkipAll: '모든 프레임 유지 (부드러운 모션)',
    frameSkip2: '2프레임마다 1장 제거 (~50% 용량 절감)',
    frameSkip3: '3프레임마다 1장만 유지 (~65% 용량 절감)',
    frameSkipDesc: '프레임을 건너뛰어도 총 재생 시간과 속도는 완벽하게 유지됩니다.',

    ditherLabel: '디더링 (Dithering)',
    ditherDesc: '부드러운 그라데이션 표현 (OFF 설정 시 용량이 더 줄어듭니다)',

    speedLabel: '애니메이션 재생 속도',
    speedOriginal: '1.0x (기본 속도)',

    // Preview Section
    previewOriginal: '원본 GIF',
    previewOptimized: '최적화된 GIF',
    play: '재생',
    pause: '일시정지',
    frameScrubber: '프레임 탐색',
    frameIndicator: '프레임',
    dimensions: '해상도',
    fileSize: '파일 크기',
    totalFrames: '총 프레임수',
    duration: '재생 시간',
    estimatedReduction: '용량 절감률',

    // Action Buttons
    btnApply: 'GIF 최적화 실행',
    btnReapply: '설정 다시 적용',
    btnDownload: '최적화된 GIF 다운로드',
    btnCopy: '클립보드 복사',
    btnReset: '다른 GIF 업로드',
    copySuccess: '클립보드에 GIF가 복사되었습니다!',
    copyError: '클립보드 복사를 지원하지 않는 브라우저입니다. 다운로드를 이용해주세요.',

    // Stats bar
    statOriginalSize: '원본 크기',
    statNewSize: '변환 크기',
    statSaved: '절약된 용량',
    statTime: '처리 시간',
  },

  en: {
    // Header & Brand
    brandName: 'Reduce GIF Size',
    brandSub: 'Online Animated GIF Optimizer',
    navTool: 'Resizer Tool',
    navPresets: 'Platform Specs',
    navGuide: 'Optimization Guide',
    navFaq: 'FAQ',
    privacyBadge: '100% In-Browser · Zero Server Upload',

    // Hero
    heroTitlePrefix: 'Ultra-Fast Online',
    heroTitleHighlight: 'GIF Size Reducer',
    heroTitleSuffix: '& Resizer',
    heroDesc:
      'Instantly resize, compress, and optimize animated GIFs in your browser without uploading to a server. Fine-tune dimensions, color palettes, and frame rates to fit platform limits effortlessly.',

    // Dropzone
    dropzoneTitle: 'Drag and drop your GIF here, or browse',
    dropzoneSub: 'Supports animated GIF files (Up to 50MB recommended) · 100% Private local processing',
    dropzonePasteHint: 'Clipboard (Ctrl+V) paste supported',
    loadSampleBtn: 'Try with sample GIF',
    uploadBtn: 'Select GIF File',

    // Status & Feedback
    decoding: 'Analyzing and decoding GIF frames...',
    encoding: 'Optimizing and encoding GIF...',
    processingProgress: 'Progress',
    cancelling: 'Cancelling...',
    errorTitle: 'Error Encountered',

    // Tool Workspace Tabs
    tabResize: 'Dimensions & Scale',
    tabCompress: 'Compress & Colors',
    tabSpeed: 'Speed & Frames',

    // Dimension Controls
    modeDimensions: 'Custom Pixels (px)',
    modePercentage: 'Percentage Scale (%)',
    modePreset: 'Platform Presets',
    widthLabel: 'Width',
    heightLabel: 'Height',
    lockAspect: 'Lock Aspect Ratio',
    unlockAspect: 'Unlock Aspect Ratio',
    percentageLabel: 'Scale Percentage',

    // Preset Controls
    selectPresetPrompt: 'Select a platform to auto-apply recommended dimensions and compression:',
    categoryKorea: 'Korean Platforms (Kakao/DC/Naver)',
    categorySocial: 'Global Social (X/Instagram/Discord)',
    categoryWeb: 'Web Banners',

    // Compression Controls
    paletteLabel: 'Color Count (Palette Quantization)',
    colors256: '256 Colors (Max Fidelity)',
    colors128: '128 Colors (Balanced - Recommended)',
    colors64: '64 Colors (High Compression)',
    colors32: '32 Colors (Maximum Reduction)',
    colors16: '16 Colors (Ultra Lightweight)',
    paletteDesc: 'Reducing color depth slashes GIF file size by 30% to 70%.',

    frameSkipLabel: 'Frame Optimization (Subsampling)',
    frameSkipAll: 'Keep All Frames (Smooth Motion)',
    frameSkip2: 'Drop Every 2nd Frame (~50% Reduction)',
    frameSkip3: 'Keep 1 of 3 Frames (~65% Reduction)',
    frameSkipDesc: 'Animation speed and duration are precisely preserved when skipping frames.',

    ditherLabel: 'Dithering',
    ditherDesc: 'Smooth color gradients (Turning OFF reduces file size further)',

    speedLabel: 'Animation Speed',
    speedOriginal: '1.0x (Normal Speed)',

    // Preview Section
    previewOriginal: 'Original GIF',
    previewOptimized: 'Optimized GIF',
    play: 'Play',
    pause: 'Pause',
    frameScrubber: 'Frame Scrubber',
    frameIndicator: 'Frame',
    dimensions: 'Dimensions',
    fileSize: 'File Size',
    totalFrames: 'Total Frames',
    duration: 'Duration',
    estimatedReduction: 'Size Reduced',

    // Action Buttons
    btnApply: 'Compress & Resize GIF',
    btnReapply: 'Apply Changes',
    btnDownload: 'Download Optimized GIF',
    btnCopy: 'Copy to Clipboard',
    btnReset: 'Upload Another GIF',
    copySuccess: 'GIF copied to clipboard successfully!',
    copyError: 'Browser does not support copying GIFs directly. Please use Download.',

    // Stats bar
    statOriginalSize: 'Original',
    statNewSize: 'Optimized',
    statSaved: 'Saved',
    statTime: 'Processing Time',
  },
} as const;

export function getTranslation(lang: Language) {
  return translations[lang] || translations.ko;
}
