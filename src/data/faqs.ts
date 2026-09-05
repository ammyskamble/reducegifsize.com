// src/data/faqs.ts

export interface FaqItem {
  question: string;
  category: string;
  answer: string;
}

export const KOREAN_FAQS: FaqItem[] = [
  {
    question: "GIF 용량을 낮추는 방법은 무엇인가요?",
    category: "용량 최적화",
    answer:
      "GIF 용량을 효과적으로 낮추는 방법은 크게 4가지입니다. 1) 가로·세로 해상도(픽셀) 축소: 50% 축소 시 전체 면적이 75% 감소하여 가장 큰 폭의 용량 절감이 일어납니다. 2) 컬러 팔레트 감축: 256색을 128색 또는 64색으로 줄이면 시각적 차이 없이 용량이 30%~50% 줄어듭니다. 3) 프레임 스킵: 2프레임마다 1장을 건너뛰고 지연 시간을 합산하여 재생 시간을 유지하면서 용량을 반으로 줄입니다. 4) 불필요한 재생 구간 트리밍: 루프에 불필요한 앞뒤 장면을 잘라내면 파일 크기를 대폭 낮출 수 있습니다.",
  },
  {
    question: "이미지를 10MB로 줄이는 방법은 무엇인가요?",
    category: "플랫폼 규격",
    answer:
      "디시인사이드 갤러리나 카카오톡 프로필 등 10MB 업로드 한도를 통과하려면, 본 툴의 '디시인사이드/10MB 프리셋'을 선택하세요. 직접 조절할 경우 가로 너비를 600px 이하로 설정하고 컬러 팔레트를 128색으로 지정한 뒤 '2프레임 스킵'을 적용하면 20MB~30MB 대용량 GIF도 화질 손상 없이 10MB 이내로 가볍게 줄일 수 있습니다.",
  },
  {
    question: "프리미어 프로에서 GIF 용량을 줄이는 방법은 무엇인가요?",
    category: "편집 프로그램",
    answer:
      "Adobe Premiere Pro에서 내보내기(Export) 시 포맷을 '애니메이션 GIF'로 선택한 후: 1) 프레임 레이트(Frame Rate)를 기본 30fps/60fps에서 12~15fps로 낮추세요. 2) 비디오 해상도를 1080p 대신 720p 또는 480p로 축소하세요. 3) 내보낸 후에도 용량이 크다면 본 사이트(Reduce GIF Size)에 업로드하여 브라우저에서 128 컬러 팔레트 최적화를 2차로 적용하면 화질 저하 없이 최종 용량을 손쉽게 5MB~10MB 이하로 압축할 수 있습니다.",
  },
  {
    question: "포토샵으로 GIF 용량을 줄이는 방법은 무엇인가요?",
    category: "편집 프로그램",
    answer:
      "Photoshop에서는 [파일] > [내보내기] > [웹용으로 저장(레거시)] (단축키 Ctrl+Alt+Shift+S)을 실행합니다. 1) 우측 상단 사전 설정에서 색상(Colors) 수를 256에서 128 또는 64로 낮춥니다. 2) '손실(Lossy)' 값을 5~15 사이로 부여하면 눈에 띄는 화질 저하 없이 LZW 압축률이 크게 향상됩니다. 3) 이미지 크기 퍼센트를 70%~80%로 축소합니다. 포토샵 설치가 번거롭다면 본 웹사이트에서 별도 프로그램 없이 동일한 원리로 1초 만에 압축할 수 있습니다.",
  },
  {
    question: "이미지 파일 용량을 낮추려면 어떻게 해야 하나요?",
    category: "이미지 기술",
    answer:
      "정적 이미지(JPG, PNG, WebP)는 불필요한 메타데이터 제거 및 80%~85% 품질 압축을 사용하면 됩니다. 반면 움직이는 GIF 애니메이션은 여러 장의 프레임과 타이밍 정보가 결합되어 있으므로, 일반 사진 압축기로는 변환할 수 없습니다. GIF 전용 리사이저를 통해 프레임 지연 시간을 보존하면서 픽셀 해상도를 줄이고 128색 인덱스 팔레트를 적용해야 움직임을 온전히 살리며 용량을 줄일 수 있습니다.",
  },
  {
    question: "GIF 속도를 조절하는 방법은 무엇인가요?",
    category: "기능 가이드",
    answer:
      "GIF의 재생 속도는 각 프레임 사이에 지정된 지연 시간(Delay time, 10ms 단위)에 의해 제어됩니다. Reduce GIF Size 툴의 [속도 & 프레임] 탭에서 0.5x(슬로우 모션), 1.25x, 1.5x, 2.0x(배속) 버튼을 클릭하면 지연 시간이 수학적으로 재계산되어 원하는 템포의 애니메이션으로 즉시 변환 및 저장할 수 있습니다.",
  },
  {
    question: "GIF 파일의 확장자는 무엇인가요?",
    category: "기초 상식",
    answer:
      "GIF 파일의 표준 확장자는 '.gif' (Graphics Interchange Format)입니다. 1987년과 1989년(GIF89a)에 제정된 무손실 압축 포맷으로, 최대 256가지의 인덱스 색상, 투명 배경(알파 인덱스), 다중 프레임 애니메이션 루프를 지원하여 웹과 메신저에서 '움짤'로 널리 사용되고 있습니다.",
  },
  {
    question: "GIF를 부드럽게 만드는 방법은 무엇인가요?",
    category: "화질 노하우",
    answer:
      "움짤을 매끄럽게 표현하려면: 1) 초당 프레임 수를 15~20 FPS 내외로 유지하고 프레임별 지연 시간을 균일하게 맞추세요. 2) 색상 전환 시 계단 현상(Banding)이 생기지 않도록 플로이드-스타인버그 디더링(Dithering) 옵션을 켜세요. 본 툴은 프레임 스킵 시에도 원본 재생 지속 시간과 지연 시간을 완벽히 누적 계산하여 뚝뚝 끊기지 않는 부드러운 모션을 유지합니다.",
  },
];

export const ENGLISH_FAQS: FaqItem[] = [
  {
    question: "How do I resize my GIF?",
    category: "How-To",
    answer:
      "To resize your animated GIF: 1) Upload your file by dragging it onto the dropzone or pasting via Ctrl+V. 2) Choose your desired width and height in pixels, or pick a percentage scale (such as 50% or 75%). 3) Keep the aspect ratio locked to prevent visual distortion. 4) Click 'Apply Changes' and preview the real-time result before downloading.",
  },
  {
    question: "Can I reduce the size of a GIF?",
    category: "Optimization",
    answer:
      "Yes! You can significantly downsize both the dimensions (width/height) and file weight (megabytes) of any animated GIF. By scaling dimensions to fit your display requirements, dropping color depth from 256 to 128 colors, and skipping every 2nd frame, you can reduce file size by 50% to 75% while keeping the animation smooth.",
  },
  {
    question: "Can I edit GIFs online?",
    category: "Online Tool",
    answer:
      "Yes, ReduceGIFSize.com is a 100% free online browser-based GIF editor. You can scale dimensions, adjust playback speed from 0.5x to 2.0x, optimize color palettes, drop frames, scrub through individual frames, and download watermark-free GIFs without installing desktop software.",
  },
  {
    question: "How can I compress a GIF to 20MB?",
    category: "Platform Limits",
    answer:
      "Platforms like Discord, KakaoTalk, and Naver have a strict 20MB upload ceiling. If your GIF is 30MB to 50MB, simply upload it to Reduce GIF Size, select our '20MB Platform Preset', or reduce the width to 700px with a 128-color palette. The live visualizer shows your exact resulting byte size to guarantee it stays safely under 20MB.",
  },
  {
    question: "How can I reduce the size of a GIF online?",
    category: "Online Tool",
    answer:
      "Use ReduceGIFSize.com: 1) Upload your GIF file in your browser. 2) Select your target dimensions or percentage. 3) Choose a color palette (128 colors is recommended for optimal fidelity and compression). 4) Click Download. All decoding and encoding happen 100% locally in your browser memory for instantaneous speed and complete privacy.",
  },
];
