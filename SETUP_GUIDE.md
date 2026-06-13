# 📚 EWA English Reading App - 설정 가이드

## 🌍 번역 기능 설정

앱이 작동하려면 번역 API를 설정해야 합니다. 4가지 옵션이 있습니다.

### 1️⃣ Google Translate (무료, 추천)
```bash
# .env 파일 생성
cp .env.example .env

# Google Translate API는 API 키가 필요하지 않음
# 하지만 CORS 문제가 있을 수 있으므로 백엔드를 통해 호출 권장
```

### 2️⃣ Claude API (Anthropic)
```bash
# 1. https://console.anthropic.com/ 에서 API 키 생성
# 2. .env 파일에 추가
REACT_APP_ANTHROPIC_API_KEY=sk-ant-xxx...
REACT_APP_DEFAULT_TRANSLATION_API=claude
```

### 3️⃣ OpenAI API
```bash
# 1. https://platform.openai.com/api-keys 에서 API 키 생성
# 2. .env 파일에 추가
REACT_APP_OPENAI_API_KEY=sk-xxx...
REACT_APP_DEFAULT_TRANSLATION_API=openai
```

### 4️⃣ DeepL API (고품질 번역)
```bash
# 1. https://www.deepl.com/docs-api 에서 API 키 생성
# 2. .env 파일에 추가
REACT_APP_DEEPL_API_KEY=xxx...
REACT_APP_DEFAULT_TRANSLATION_API=deepl
```

## ⌨️ 스페이스바 제어

TTS(음성 읽기)를 스페이스바로 제어할 수 있습니다:

```
스페이스바 누르기 → TTS 시작/중지
```

## 👆 터치 제어 (모바일)

다음과 같이 터치로 제어할 수 있습니다:

```
위/아래 스와이프      → 페이지 이전/다음
더블탭 (중앙)         → TTS 시작/중지
하단부 터치            → TTS 시작/중지
```

## 🚀 개발 환경 시작

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 열기
# http://localhost:3001
```

## 📖 주요 기능

### 1. 책 읽기
- ✅ 페이지 플립 애니메이션
- ✅ 손가락 스와이프 또는 버튼으로 페이지 이동
- ✅ 자동 페이지 넘김 (▶ 버튼)

### 2. TTS (Text-to-Speech)
- ✅ Samantha 음성 (기본)
- ✅ 1.1배속 (조정 가능)
- ✅ 스페이스바/터치로 제어
- ✅ 단어별 하이라이팅
- ✅ 진행률 표시

### 3. 다국어 번역
- ✅ 10개 언어 지원
- ✅ 4가지 API 옵션
- ✅ 병렬 표시 (원문/번역)

### 4. 어휘 학습
- ✅ 중요 단어 자동 강조
- ✅ CEFR 레벨 표시
- ✅ 시험 태그 (IELTS, TOEIC, TOEFL)
- ✅ 정의 및 예문

### 5. AI 토론 (💬)
- ✅ 책에 대해 AI와 대화
- ✅ 배운점, 응용, 작가의 의도 분석
- ✅ 4가지 AI 모델 선택 가능 (Gemma2, Claude, GPT, Llama)

### 6. 오프라인 저장
- ✅ IndexedDB에 자동 저장
- ✅ 언제든 다시 읽기 가능

## 🔧 문제 해결

### 번역이 작동하지 않는 경우
1. `.env` 파일이 생성되었는지 확인
2. API 키가 정확히 입력되었는지 확인
3. 개발 서버를 재시작 (`npm run dev`)

### TTS가 작동하지 않는 경우
1. 브라우저가 Web Speech API를 지원하는지 확인
2. 음성을 선택했는지 확인
3. 속도 설정이 정상인지 확인

### 페이지가 로드되지 않는 경우
1. 인터넷 연결 확인
2. Project Gutenberg API 상태 확인
3. 브라우저 콘솔에서 에러 메시지 확인

## 📚 지원되는 도서 출처

- **Project Gutenberg** (70,000+ 도서)
  - 무료 저작권 만료 도서
  - 영문 도서 중심

- **우리 자체 색인** (25+ 도서)
  - 정선된 고전 문학
  - 난이도별 분류
  - 카테고리별 분류

## 💡 팁

1. **첫 번째 책**: 난이도 낮은 책부터 시작하세요
2. **TTS 속도**: 1.0배속부터 시작해서 점차 빠르게
3. **단어 학습**: 노란색으로 강조된 단어는 중요합니다
4. **번역 병렬**: 원문과 번역을 함께 보면 이해도가 높아집니다
5. **AI 토론**: 장을 읽은 후 💬로 내용을 정리하세요

## 🌐 온라인 배포

```bash
# Vercel, Netlify 등에 배포
npm run build

# 환경 변수 설정 (배포 플랫폼에서)
REACT_APP_ANTHROPIC_API_KEY=...
REACT_APP_OPENAI_API_KEY=...
REACT_APP_DEEPL_API_KEY=...
REACT_APP_DEFAULT_TRANSLATION_API=google
```

---

**행운을 빕니다! Happy Reading! 📖**
