// src/data/i18n.ts
import type { Language } from '../types';

export const translations = {
  ko: {
    // Header & Brand
    brandName: 'GifResizetool',
    brandSub: 'GIF 용량 줄이기 & 리사이저',
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
      '서버 업로드 없이 100% 브라우저 내에서 디스코드 256KB 이모지/512KB 스티커, 카카오톡, 디시인사이드 10MB 한도 맞춤 압축 및 해상도 조절을 즉시 실행하세요.',

    // Dropzone
    dropzoneTitle: 'GIF 파일을 여기로 드래그하거나 클릭하여 업로드',
    dropzoneSub: '애니메이션 GIF 파일 지원 · 100% 안전한 로컬 브라우저 처리 (서버 미전송)',
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
    tabTarget: '목표 용량 (디스코드/카톡)',
    tabResize: '해상도 / 크기 조절',
    tabCompress: '색상 & 압축 방식',
    tabSpeed: '속도 / 구간 자르기',

    // Target Solver
    targetSectionTitle: '목표 용량 맞춤 원클릭 자동 압축',
    targetSectionDesc: '원하는 플랫폼 용량 한도를 선택하면 해상도, 색상, 프레임을 자동으로 최적 계산합니다:',
    btnAutoSolve: '스마트 자동 압축 적용',
    customTargetLabel: '직접 목표 용량 입력',
    targetUnitKb: 'KB',
    targetUnitMb: 'MB',

    // Dimension Controls
    modeDimensions: '직접 입력 (px)',
    modePercentage: '비율 조절 (%)',
    modePreset: '플랫폼 프리셋',
    modeTarget: '목표 용량 맞춤',
    widthLabel: '가로 너비',
    heightLabel: '세로 높이',
    lockAspect: '비율 유지',
    unlockAspect: '비율 해제',
    percentageLabel: '축소 비율',

    // Preset Controls
    selectPresetPrompt: '플랫폼을 선택하면 권장 크기와 압축률이 자동 적용됩니다:',
    categoryDiscord: '디스코드 전용 (이모지 256KB / 스티커 512KB)',
    categoryKorea: '국내 플랫폼 (카카오/디시/네이버)',
    categorySocial: '글로벌 소셜 (X/인스타/텔레그램)',
    categoryWeb: '웹 배너 규격',

    // Compression Controls
    paletteLabel: '색상 수 (컬러 팔레트)',
    colors256: '256 색상 (최고 화질)',
    colors192: '192 색상 (고품질)',
    colors128: '128 색상 (균형 권장)',
    colors96: '96 색상 (디스코드 최적)',
    colors64: '64 색상 (높은 압축률)',
    colors32: '32 색상 (최대 압축)',
    colors16: '16 색상 (초경량)',
    paletteDesc: '색상 수를 줄이면 GIF 파일 용량이 30%~70% 대폭 감소합니다.',

    colorFormatLabel: '인코딩 포맷',
    formatRgb565: 'RGB565 (표준 고화질)',
    formatRgb444: 'RGB444 (고압축)',
    formatRgba4444: 'RGBA4444 (투명도 지원)',

    frameSkipLabel: '프레임 최적화 (프레임 스킵)',
    frameSkipAll: '모든 프레임 유지 (부드러운 100% 모션)',
    frameSkip2: '2프레임마다 1장 제거 (~50% 용량 절감)',
    frameSkip3: '3프레임마다 1장만 유지 (~67% 용량 절감)',
    frameSkip4: '4프레임마다 1장만 유지 (~75% 용량 절감)',
    frameSkipDesc: '프레임을 건너뛰어도 누적 시간 계산으로 총 재생 속도는 완벽 유지됩니다.',

    ditherLabel: '디더링 (Dithering)',
    ditherDesc: '부드러운 그라데이션 표현 (OFF 설정 시 용량이 더 줄어듭니다)',

    // Speed & Trim
    speedLabel: '애니메이션 재생 속도',
    speedOriginal: '1.0x (기본 속도)',
    reverseLabel: '역재생 (Reverse)',
    reverseDesc: '애니메이션을 거꾸로 역방향 재생합니다.',
    trimTitle: '프레임 구간 자르기 (트리밍)',
    trimStart: '시작 프레임',
    trimEnd: '종료 프레임',
    trimDesc: '앞뒤 불필요한 프레임을 잘라내면 용량을 획기적으로 줄일 수 있습니다.',

    // Preview Section
    previewOriginal: '원본 GIF',
    previewOptimized: '최적화된 GIF',
    viewSplit: '화면 분할 비교 (Split)',
    viewSide: '나란히 보기 (Side-by-Side)',
    viewSingle: '결과물만 보기',
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
    brandName: 'GifResizetool',
    brandSub: 'Animated GIF Resizer & Compressor',
    navTool: 'Resizer Tool',
    navPresets: 'Platform Specs',
    navGuide: 'Optimization Guide',
    navFaq: 'FAQ',
    privacyBadge: '100% In-Browser · Zero Server Upload',

    // Hero
    heroTitlePrefix: 'Ultra-Fast Online',
    heroTitleHighlight: 'GIF Compressor & Resizer',
    heroTitleSuffix: 'Free Tool',
    heroDesc:
      'Compress and resize animated GIFs 100% in your browser. Hit Discord 256KB emoji / 512KB sticker, KakaoTalk, and DC Inside 10MB upload limits instantly with zero server uploads.',

    // Dropzone
    dropzoneTitle: 'Drag and drop your GIF here, or browse',
    dropzoneSub: 'Supports animated GIF files · 100% Private local browser processing (Zero server uploads)',
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
    tabTarget: 'Target Size (Discord/Chat)',
    tabResize: 'Dimensions & Scale',
    tabCompress: 'Colors & Encoding',
    tabSpeed: 'Speed & Trim',

    // Target Solver
    targetSectionTitle: 'Smart Target File Size Solver',
    targetSectionDesc: 'Select your target ceiling to auto-calculate optimal dimensions, colors, and frame skipping:',
    btnAutoSolve: 'Apply Smart Auto-Compress',
    customTargetLabel: 'Custom Target Size',
    targetUnitKb: 'KB',
    targetUnitMb: 'MB',

    // Dimension Controls
    modeDimensions: 'Custom Pixels (px)',
    modePercentage: 'Percentage Scale (%)',
    modePreset: 'Platform Presets',
    modeTarget: 'Target Size Solver',
    widthLabel: 'Width',
    heightLabel: 'Height',
    lockAspect: 'Lock Aspect Ratio',
    unlockAspect: 'Unlock Aspect Ratio',
    percentageLabel: 'Scale Percentage',

    // Preset Controls
    selectPresetPrompt: 'Select a platform to auto-apply recommended dimensions and compression:',
    categoryDiscord: 'Discord Dedicated (256KB Emoji / 512KB Sticker)',
    categoryKorea: 'Korean Platforms (Kakao/DC/Naver)',
    categorySocial: 'Global Social (X/Instagram/Telegram)',
    categoryWeb: 'Web Banners',

    // Compression Controls
    paletteLabel: 'Color Count (Palette Quantization)',
    colors256: '256 Colors (Max Fidelity)',
    colors192: '192 Colors (High Quality)',
    colors128: '128 Colors (Balanced - Recommended)',
    colors96: '96 Colors (Discord Optimized)',
    colors64: '64 Colors (High Compression)',
    colors32: '32 Colors (Maximum Reduction)',
    colors16: '16 Colors (Ultra Lightweight)',
    paletteDesc: 'Reducing color depth slashes GIF file size by 30% to 70%.',

    colorFormatLabel: 'Pixel Format',
    formatRgb565: 'RGB565 (High Fidelity)',
    formatRgb444: 'RGB444 (High Compression)',
    formatRgba4444: 'RGBA4444 (Transparent Alpha)',

    frameSkipLabel: 'Frame Optimization (Subsampling)',
    frameSkipAll: 'Keep All Frames (Smooth Motion)',
    frameSkip2: 'Drop Every 2nd Frame (~50% Reduction)',
    frameSkip3: 'Keep 1 of 3 Frames (~67% Reduction)',
    frameSkip4: 'Keep 1 of 4 Frames (~75% Reduction)',
    frameSkipDesc: 'Animation speed and duration are precisely preserved through cumulative delays.',

    ditherLabel: 'Dithering',
    ditherDesc: 'Smooth color gradients (Turning OFF reduces file size further)',

    // Speed & Trim
    speedLabel: 'Animation Speed',
    speedOriginal: '1.0x (Normal Speed)',
    reverseLabel: 'Reverse Animation',
    reverseDesc: 'Play frames backwards in reverse order.',
    trimTitle: 'Timeline Frame Trimming',
    trimStart: 'Start Frame',
    trimEnd: 'End Frame',
    trimDesc: 'Cut unnecessary start or end frames to dramatically drop file size before compression.',

    // Preview Section
    previewOriginal: 'Original GIF',
    previewOptimized: 'Optimized GIF',
    viewSplit: 'Split-Screen Wipe Slider',
    viewSide: 'Side-by-Side',
    viewSingle: 'Optimized Only',
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
