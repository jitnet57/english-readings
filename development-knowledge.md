# 개발 지식 베이스 (Development Knowledge)

EWA-스타일 영어 독서 앱 개발 중 발생한 모든 에러의 **원인**과 **처방**을 빠짐없이 기록한 문서입니다.
같은 실수를 반복하지 않기 위한 트러블슈팅 레퍼런스입니다.

> 기술 스택: React 18 + TypeScript + Vite + Tailwind CSS + Zustand
> 외부 연동: Web Speech API(TTS), Project Gutenberg, MyMemory 번역 API, IndexedDB→메모리 저장소

---

## 📌 목차

1. [stale `.js` 파일이 새 `.ts`를 가린 문제 (최악의 근본 원인)](#1-stale-js-파일-문제-)
2. [번역 CORS 차단 (Google Translate)](#2-번역-cors-차단-google-translate)
3. [데모 번역의 품질 문제 (단어 부분 치환)](#3-데모-번역-품질-문제)
4. [IndexedDB `objectStore is not a function`](#4-indexeddb-objectstore-is-not-a-function)
5. [Project Gutenberg 타임아웃 & 가짜 샘플 텍스트](#5-project-gutenberg-타임아웃--가짜-샘플-텍스트)
6. [TypeScript 빌드 에러 모음](#6-typescript-빌드-에러-모음)
7. [JSX 구문 에러 (`>` 문자)](#7-jsx-구문-에러--문자)
8. [중복 React key 경고](#8-중복-react-key-경고)
9. [BookReader undefined 에러](#9-bookreader-undefined-에러)
10. [TTS 하이라이트 색상/싱크 문제](#10-tts-하이라이트-색상싱크-문제)
11. [stale `vite.config.js`가 프록시 설정을 무력화](#11-stale-viteconfigjs가-프록시-설정을-무력화-)
12. [떠도는 Service Worker가 요청 가로채기](#12-떠도는-service-worker가-요청-가로채기)
13. [중복 Vite 프로세스(유령 서버)](#13-중복-vite-프로세스유령-서버)
14. [Gutenberg 실제 텍스트 — Vite dev 프록시 해법](#14-gutenberg-실제-텍스트--vite-dev-프록시-해법)
15. [재발 방지 체크리스트](#-재발-방지-체크리스트)

---

## 1. stale `.js` 파일 문제 ⭐

> **이번 프로젝트에서 가장 오래, 가장 끈질기게 반복된 에러의 진짜 원인.**
> 소스를 아무리 고쳐도 콘솔 에러가 똑같이 나오는 "유령 버그".

### 증상
- `.ts` 파일을 수정하고 dev 서버를 재시작해도 **콘솔 에러가 그대로 반복**됨.
- 에러 스택이 `downloadService.js:27`, `translationService.js:77` 처럼 **`.js` 확장자**를 가리킴.
  (우리 소스는 전부 `.ts`/`.tsx`인데 `.js`를 참조 → 결정적 단서)
- 번역 코드를 데모로 바꿨는데도 `translate.googleapis.com` CORS 에러가 계속 발생.
- IndexedDB를 메모리 저장소로 교체했는데도 `database.objectStore is not a function`이 계속 발생.

### 원인
`src/` 디렉토리에 **과거에 `tsc`로 컴파일된 `.js` 파일 28개**가 `.ts` 파일과 **나란히** 존재했다.

```
src/services/downloadService.ts   ← 6/14 수정 (새 코드: 메모리 저장소)
src/services/downloadService.js   ← 6/12 컴파일된 옛 코드 (IndexedDB) ❌ 이게 로드됨
src/services/translationService.ts ← 6/14 수정 (MyMemory)
src/services/translationService.js ← 6/12 옛 코드 (Google Translate CORS) ❌
```

- import 경로가 확장자 없이 `from './downloadService'` 형태였고,
  모듈 해석 시 **stale `.js`가 우선 선택**되어 옛 코드가 실행됨.
- 옛 `.js`는 `tsconfig.json`에 `noEmit`이 없던 시절 `tsc`가 `src/`에 직접 출력한 결과물.

### 진단 방법
```bash
# .ts/.tsx 짝이 있는 .js (= stale 컴파일 결과물) 찾기
find src -name "*.js"

# 짝 없는 순수 .js(손으로 쓴 진짜 파일)가 있는지 확인 — 있으면 삭제 금지
for js in $(find src -name "*.js"); do
  base="${js%.js}"
  [ ! -f "${base}.ts" ] && [ ! -f "${base}.tsx" ] && echo "ORPHAN(보존): $js"
done
```

### 처방
```bash
# 1) 모든 stale .js 삭제 (Vite+TS 프로젝트의 src에는 .js가 있으면 안 됨)
find src -name "*.js" -delete

# 2) Vite 캐시 제거 후 재시작
rm -rf node_modules/.vite
npm run dev
```

### 재발 방지
- `tsconfig.json`에 **반드시** `"noEmit": true` 설정 (Vite가 트랜스파일 담당, tsc는 타입체크만).
- `.gitignore`에 `src/**/*.js` 추가 검토.
- 타입체크는 `tsc -b`가 아니라 `tsc --noEmit`로 실행.
- **교훈**: 콘솔 스택의 확장자가 `.js`인데 소스가 `.ts`라면 → stale 컴파일 결과물을 의심하라.

---

## 2. 번역 CORS 차단 (Google Translate)

### 증상
```
Access to fetch at 'https://translate.googleapis.com/translate_a/element.js'
from origin 'http://localhost:3000' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
POST .../translate_a/element.js net::ERR_FAILED 405 (Method Not Allowed)
```

### 원인
- 브라우저에서 Google Translate 비공식 엔드포인트로 **직접 `fetch`** 시도.
- Google은 `Access-Control-Allow-Origin` 헤더를 주지 않음 → 브라우저가 차단.
- 게다가 해당 엔드포인트는 POST를 허용하지 않음(405).
- 프론트엔드에서 Google Translate 직접 호출은 **구조적으로 불가능**.

### 처방
무료 + CORS 지원 + API 키 불필요한 **MyMemory API**로 교체.

```ts
// langpair: 'en|ko', 'en|ja', 'en|zh-CN' ...
const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;
const data = await (await fetch(url)).json();
const translated = data.responseData.translatedText;
```

검증:
```bash
curl -s -I "https://api.mymemory.translated.net/get?q=test&langpair=en|ko" | grep -i access-control
# → access-control-allow-origin: *  (브라우저에서 작동 확정)
```

### 대안 (필요 시)
- **백엔드 프록시** 구축 후 Google/DeepL 호출 (CORS 우회).
- **Claude/OpenAI API**: 키 필요하지만 고품질. 브라우저 직접 호출 시 키 노출 위험 → 백엔드 권장.
- **주의**: `REACT_APP_*` 환경변수는 Vite에서 동작 안 함. Vite는 `import.meta.env.VITE_*` 사용.

### 교훈
- 무료 외부 API를 붙이기 전 `curl -I`로 **CORS 헤더(`access-control-allow-origin`)부터 확인**.
- 브라우저 직접 호출이 막히는 서드파티는 백엔드 프록시가 정석.

---

## 3. 데모 번역 품질 문제

### 증상
번역 결과가 엉터리:
- `history` → `hi이야기` (단어 안의 `story`가 `이야기`로 치환됨)
- `시간 not long ago` (일부 단어만 번역, 나머지는 영어 그대로)

### 원인
임시 데모 번역이 **단어 사전 기반 부분 문자열 치환**이었음:
```ts
translated = text.toLowerCase();
for (const [eng, ko] of Object.entries(dict)) {
  translated = translated.replace(new RegExp(eng, 'gi'), ko); // 단어 경계 무시!
}
```
- `\b` 단어 경계가 없어 `history` 안의 `story`까지 치환.
- 사전에 없는 단어는 영어로 남음 → 문장이 깨짐.

### 처방
- 부분 치환 데모를 **폐기**하고 실제 번역 API(MyMemory) 사용 (→ [2번](#2-번역-cors-차단-google-translate)).
- 긴 텍스트는 API 길이 제한(~450자)에 맞춰 **문장 단위로 분할** 후 순차 번역:
```ts
const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
// chunk가 maxLen 넘으면 새 chunk 시작, 각 chunk를 translateChunk()
```
- 실패 시 **원문 반환**(엉터리 치환 대신).

### 교훈
- "임시 데모"라도 사용자에게 보이면 품질 문제로 인식됨. 가짜 로직은 명확히 분리/표시.
- 문자열 치환 번역은 절대 금물. 단어 경계·어순·문맥을 무시함.

---

## 4. IndexedDB `objectStore is not a function`

### 증상
```
Uncaught TypeError: database.objectStore is not a function
  at request.onupgradeneeded (downloadService.js:27)
Error getting all books: AbortError: Version change transaction was aborted
  in upgradeneeded event handler.
```

### 원인
`onupgradeneeded` 핸들러에서 **존재하지 않는 메서드** 호출:
```ts
// ❌ 잘못된 코드: IDBDatabase에는 objectStore()가 없음 (트랜잭션에만 있음)
(database.objectStoreNames.contains(STORE)
  ? database.objectStore(STORE)        // ← 이 메서드 자체가 없음 → TypeError
  : database.createObjectStore(STORE)
).createIndex(...);
```
- `objectStore()`는 `IDBTransaction`의 메서드이지 `IDBDatabase`의 메서드가 아님.
- 핸들러에서 throw → 업그레이드 트랜잭션 abort → 모든 DB 작업 연쇄 실패.
- (게다가 stale `.js` 때문에 수정 후에도 옛 코드가 계속 실행됨 → [1번](#1-stale-js-파일-문제-) 참고)

### 처방 (1차) — 올바른 IndexedDB 초기화
```ts
request.onupgradeneeded = (event) => {
  const db = (event.target as IDBOpenDBRequest).result;
  if (!db.objectStoreNames.contains(BOOKS_STORE)) {
    db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains(TRANSLATIONS_STORE)) {
    const store = db.createObjectStore(TRANSLATIONS_STORE, { keyPath: 'id' });
    store.createIndex('bookLanguage', ['bookId', 'language'], { unique: true });
  }
};
```

### 처방 (2차) — IndexedDB 완전 제거
복잡한 스키마 버전 관리/마이그레이션이 불안정하여 **메모리 기반 `Map` 저장소**로 단순화:
```ts
const memoryBooks = new Map<number, DownloadedBook>();
const memoryTranslations = new Map<string, TranslatedBook>();
// 같은 async 시그니처 유지하여 호출부 변경 불필요
```
- 트레이드오프: 새로고침 시 데이터 소실 (오프라인 영구저장 포기). 안정성 우선.
- 추후 영구저장이 필요하면 `idb` 같은 검증된 래퍼 라이브러리 사용 권장.

### 교훈
- IndexedDB 원시 API는 까다로움. `onupgradeneeded`에서 throw하면 전체 트랜잭션 abort.
- `objectStore()`(트랜잭션) vs `createObjectStore()`(DB, 업그레이드 중에만) 혼동 주의.

---

## 5. Project Gutenberg 타임아웃 & 가짜 샘플 텍스트

### 증상 A — 타임아웃
```
gutenbergService.js:32 Error fetching book text: TimeoutError: signal timed out
```

### 증상 B — 가짜 텍스트 (더 심각)
화면에 실제 책이 아닌 `"The story of Book Content by Author ..."` 플레이스홀더만 표시됨.

### 원인
- 초기 직접 fetch(`gutenberg.org/.../pg{id}.txt`)가 느리고 CORS 미지원.
- Gutendex(`gutendex.com`)는 **메타데이터만** 제공, 본문 텍스트는 안 줌.
- 코드가 메타데이터만 받고 **항상 `generateSampleText()` 호출** → 실제 책을 한 번도 안 불러옴.
- gutenberg.org `.txt`는 `access-control-allow-origin` 헤더 없음 → 브라우저 직접 fetch 차단.

### 처방
**CORS 프록시 경유 + 재시도 + 헤더/푸터 제거 + 안전한 폴백**:
```ts
const proxies = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];
// 1) 프록시로 실제 txt 가져오기 (20s 타임아웃, 최대 3회, 프록시 교대)
// 2) *** START/END OF ... PROJECT GUTENBERG EBOOK *** 사이 본문만 추출
// 3) 5KB 미만 응답은 에러페이지로 간주하고 폐기
// 4) 전부 실패 시에만 generateSampleText() 폴백
```

검증:
```bash
curl -s "https://api.allorigins.win/raw?url=https://www.gutenberg.org/cache/epub/1342/pg1342.txt" \
  --max-time 25 -o /tmp/book.txt && wc -c /tmp/book.txt
# → 317178 bytes (실제 책 전문)
```

### 주의 (프록시 신뢰성)
- `allorigins.win`: 가끔 `error code: 522`(다운). 재시도로 대응.
- `corsproxy.io`: **유료화됨** (`Server-side requests are not allowed on your plan`).
- `codetabs`: `quest` 파라미터 **URL 인코딩 필수** (안 하면 `Bad request`).
- 공개 프록시는 언제든 죽을 수 있음 → 다중 프록시 + 폴백 필수. 프로덕션은 자체 프록시 권장.

### 교훈
- "데이터를 가져온다"와 "진짜 데이터를 가져온다"는 다름. 항상 **실제 응답 내용/크기**를 검증.
- 외부 텍스트는 보일러플레이트(머리말/꼬리말) 제거 후처리가 필요.

---

## 6. TypeScript 빌드 에러 모음

`npm run build`(`tsc -b && vite build`) 시 한꺼번에 터진 에러들.

### 6-1. `moduleResolution` 충돌
```
Option '--resolveJsonModule' cannot be specified when 'moduleResolution' is 'classic'.
```
**처방**: `tsconfig.json`에 `"moduleResolution": "bundler"` 추가.

### 6-2. `.tsx` 확장자 import 불가
```
An import path can only end with a '.tsx' extension when 'allowImportingTsExtensions' is enabled.
```
**처방**: `"allowImportingTsExtensions": true` + 동반 필수 옵션 `"noEmit": true`.
(`noEmit`은 stale `.js` 재생성도 막아주는 일석이조 — [1번](#1-stale-js-파일-문제-) 참고)

### 6-3. 미사용 import/변수 (`noUnusedLocals`/`noUnusedParameters`)
```
'sampleBooks' is declared but its value is never read. (TS6133)
'ArrowRight' is declared but never read.
'idx' is declared but never read. ...
```
**처방**: 미사용 import 제거, 미사용 콜백 파라미터 삭제(`(book, idx) => ` → `(book) => `),
미사용 변수는 주석 처리 또는 삭제.

### 6-4. 타입 불일치
```
TranslatedBook.id: Type 'string | number' is not assignable to type 'number'.
DownloadedBook: Property 'pages' is missing ...
'TargetLanguage' and '"en"' have no overlap.
openLibraryService: 'string' not assignable to '"beginner"|"intermediate"|"advanced"'.
```
**처방**:
- `TranslatedBook.id` 타입을 `string`으로 변경(`${bookId}_${language}` 형태).
- `downloadBook`에서 content를 페이지로 분할해 `pages` 필드 채움.
- 불가능한 비교(`targetLanguage !== 'en'`) 제거 — `TargetLanguage`에 `'en'` 없음.
- level 값은 화이트리스트 검증 후 캐스팅:
  `['beginner','intermediate','advanced'].includes(level) ? level as ... : 'intermediate'`.

### 교훈
- strict 옵션(`noUnusedLocals` 등)은 코드 위생에 좋지만, 개발 중엔 빌드를 자주 막음.
- 큰 수정 후엔 `npx tsc --noEmit`로 **빌드 전에** 타입 에러를 일괄 확인.

---

## 7. JSX 구문 에러 (`>` 문자)

### 증상
```
PageFlipReader.tsx(449,40): error TS1382: Unexpected token. Did you mean `{'>'}` or `&gt;`?
```

### 원인
JSX 텍스트 노드 안에 raw `>` 문자 사용:
```tsx
<p>⏱️ 스페이스바로 TTS 재생/중지 (설정 > ⏱️싱크 조정)</p>  // ❌ '>'를 태그로 오인
```

### 처방
HTML 엔티티로 이스케이프:
```tsx
<p>⏱️ ... (설정 &gt; ⏱️싱크 조정)</p>  // ✅
```
(또는 `{'>'}` 표현식 사용)

### 교훈
JSX 텍스트의 `<`, `>`, `{`, `}`는 이스케이프 필요(`&lt;` `&gt;` `&#123;` `&#125;`).

---

## 8. 중복 React key 경고

### 증상
```
Warning: Encountered two children with the same key, `1661`.
Warning: ... same key, `1342`.
```

### 원인
`booksDatabase.ts` / `POPULAR_BOOKS`에 **같은 Gutenberg ID가 중복** 등록:
- `1661` → Sherlock Holmes 두 항목
- `1342` → Pride and Prejudice 여러 항목 (카테고리/레벨별 중복)

`key={book.id}` 사용 시 React가 동일 key 충돌 경고.

### 처방
- 중복 ID를 고유 ID로 정리(예: 다른 Gutenberg ID 41, 110, 175 등으로 교체).
- 또는 key를 합성: `key={`${book.id}-${book.category}`}` / `key={`${book.id}-${idx}`}`.
- `booksDatabase.ts`의 `BOOKS_INDEX`는 정리 완료(고유 ID 확인). 단 `POPULAR_BOOKS`에는
  여전히 의도적 중복 항목 존재 → 렌더링 시 합성 key 권장.

### 교훈
배열 렌더링 key는 **데이터 전역에서 고유**해야 함. 외부 ID가 중복될 수 있으면 합성 key 사용.

---

## 9. BookReader undefined 에러

### 증상
```
BookReader.tsx:66 Cannot read properties of undefined (reading '0')
```
추천 도서 클릭 시 발생.

### 원인
- `RecommendedBooks`가 `BookIndex`(메타데이터: id/title/author...) 객체를 전달.
- 그러나 `BookReader`는 `Book`(본문 `sentences[]` 보유) 인터페이스를 기대.
- 타입이 다른 객체를 받아 `sentences[0]` 접근 시 undefined.

### 처방
라우팅 흐름 변경 — `BookReader`를 우회하고 `GutenbergSearcher` 경유:
```
RecommendedBooks 클릭
  → App이 selectedBookIndex 설정
  → GutenbergSearcher 오픈 (ID로 본문 다운로드)
  → PageFlipReader로 실제 읽기
```
`BookReader`는 Gutenberg 도서 흐름에서 미사용.

### 교훈
컴포넌트 간 props는 **인터페이스 계약**. 메타데이터 객체와 본문 객체를 구분하고,
ID만 넘긴 뒤 수신 측에서 본문을 로드하는 패턴이 안전.

---

## 10. TTS 하이라이트 색상/싱크 문제

### 증상 A — 빨간색 하이라이트
사용자 요구: "빨간색 말고 노란 형광색으로".

**처방**: Tailwind 클래스 `bg-red-*`/`text-red-*` → `bg-yellow-*` 계열로 교체.
- 현재 단어: `bg-yellow-300` + `animate-pulse`
- 읽은 단어: `bg-yellow-200`
- 중요 어휘: `bg-yellow-100` + 물결 밑줄

### 증상 B — 싱크 안 맞음
TTS 음성과 단어 하이라이트 타이밍 불일치.

### 원인
Web Speech API는 단어별 정확한 타이밍 콜백을 제공하지 않음(`onboundary` 지원 불안정).
단어 길이/속도 기반 **추정 타이밍**(기본 450ms/단어 ÷ 속도 × 길이계수)을 사용 → 오차 누적.

### 처방
- 사용자 조정 가능한 **싱크 오프셋**(`syncOffset`, localStorage 저장) 도입:
  `timing = max(0, estimated + syncOffset)`.
- 조정 UI: 슬라이더(±500ms), ±100ms 버튼, 초기화 버튼.
- **방향키 단축키**: `ArrowLeft`/`ArrowRight`로 오프셋 ±100ms (요구사항 반영).
- `Space`로 재생/정지.

### 교훈
Web Speech API 단어 동기화는 본질적으로 부정확. 사용자 보정 수단(오프셋)을 제공하는 게 현실적.
키보드 핸들러는 의존성 배열(`[isPlaying, rate, ...]`)을 정확히 지정해 stale closure 방지.

---

## 11. stale `vite.config.js`가 프록시 설정을 무력화 ⭐

> [1번](#1-stale-js-파일-문제-)과 **완전히 동일한 근본 원인이 설정 파일에서 재발**.
> 소스 코드뿐 아니라 **빌드 설정 파일**도 stale `.js`에 당할 수 있다.

### 증상
- `vite.config.ts`에 `server.proxy`를 추가했는데도 프록시가 전혀 작동 안 함.
- 브라우저가 `/gutenberg/...` 요청에 **앱 HTML 셸(index.html, ~629 bytes)**을 반환.
  (프록시가 적용됐다면 책 텍스트가 와야 함)
- 앱이 여전히 공개 CORS 프록시(`fetchViaProxy`)로만 동작.

### 원인
루트에 **컴파일된 옛 설정 파일**이 남아 있었음:
```
vite.config.ts    ← 6/14 새 버전 (proxy 설정 O)
vite.config.js    ← 6/12 옛 컴파일본 (proxy 설정 X)  ❌ Vite가 이걸 로드
vite.config.d.ts  ← 6/12 stale 선언 파일
```
- Vite는 설정 파일 해석 시 stale `vite.config.js`를 집어 들어 **proxy 없는 옛 설정**을 적용.
- `grep -c proxy vite.config.js` → `0`, `grep -c proxy vite.config.ts` → `1`로 확정.

### 진단 방법
```bash
ls -la vite.config.*          # .js와 .ts가 공존하면 의심
grep -c proxy vite.config.js  # 0이면 옛 버전이 로드되는 중
```

### 처방
```bash
rm -f vite.config.js vite.config.d.ts   # stale 설정만 삭제
# postcss.config.js, tailwind.config.js는 .ts 짝이 없는 정상 파일 → 보존!
# 서버 완전 재시작 (설정 변경은 HMR 안 됨)
```
검증:
```bash
curl -s "http://localhost:3000/gutenberg/cache/epub/161/pg161.txt" -o /tmp/t.txt -w "%{http_code}\n"
wc -c /tmp/t.txt   # → 712842 bytes (실제 책) = 프록시 작동 ✅
```

### 교훈
- stale `.js`는 `src/`뿐 아니라 **루트 설정 파일(`vite.config`, 잠재적으로 다른 것도)**에도 존재할 수 있다.
- **정상 `.js` 설정과 구분**: `postcss.config.js`/`tailwind.config.js`는 손으로 쓴 정상 파일(`.ts` 짝 없음).
  `.ts` 짝이 있는 `.js`만 stale → 삭제 대상.
- 설정 파일 변경은 HMR이 안 되므로 **반드시 dev 서버 완전 재시작**.

---

## 12. 떠도는 Service Worker가 요청 가로채기

### 증상
```
service-worker.js:241 [Service Worker] Loaded successfully
```
- 프로젝트에 `service-worker.js`도, `public/`도, SW 등록 코드도 **전혀 없는데** SW가 로드됨.
- 오래된 캐시가 새 코드/응답을 가릴 수 있음.

### 원인
- **이전에 `localhost:3000`에서 돌던 다른 프로젝트**가 등록한 Service Worker가
  브라우저에 남아 우리 앱의 fetch/asset 요청을 가로채고 캐싱.
- Service Worker는 origin(`localhost:3000`) 단위로 등록되므로, 포트만 같으면 **다른 앱이어도 영향**.
- "옛 코드가 계속 로드되던" 현상의 **또 다른 숨은 공범**.

### 진단 방법
```bash
# 프로젝트에 SW 파일/등록 코드가 있는지
find . -name "service-worker.js" -not -path "*/node_modules/*"
grep -rn "serviceWorker" src/ index.html
# → 결과 없는데 콘솔에 SW 로그가 뜨면 = 외부(이전 프로젝트) SW
```
또는 DevTools → Application → Service Workers 에서 등록된 SW 확인.

### 처방
진입점(`main.tsx`)에 **떠도는 SW 제거 + 캐시 정리** 코드 추가:
```ts
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
  if ('caches' in window) {
    caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
  }
}
```
수동: DevTools → Application → Service Workers → **Unregister**, 또는 Clear storage.

### 교훈
- `localhost`의 특정 포트를 여러 프로젝트가 공유하면 SW/캐시가 **교차 오염**된다.
- SW를 안 쓰는 앱이라도 방어적으로 unregister 코드를 두면 안전.
- 프로젝트마다 **다른 포트** 사용을 권장.

---

## 13. 중복 Vite 프로세스(유령 서버)

### 증상
- 설정/코드를 고치고 재시작했는데도 옛 동작이 유지됨.
- `pkill -f "npm run dev"`로 종료했다고 생각했으나 실제론 옛 서버가 계속 응답.

### 원인
- 포트 3000에 **vite 프로세스가 2개** 떠 있었음:
  ```
  28135 node .../node_modules/.bin/vite   ← 옛 서버 (proxy 설정 없음)
  45721 ...                                ← 또 다른 인스턴스
  ```
- `pkill -f "npm run dev"`는 **npm 래퍼만** 잡고, 실제 `node .../bin/vite` 자식 프로세스는 안 잡힘.
- 옛 서버가 포트를 계속 점유하며 옛 설정으로 응답 → 새 서버 효과 무효화.

### 진단 방법
```bash
ps aux | grep "bin/vite" | grep -v grep   # 1개 초과면 중복
lsof -ti:3000                              # 포트 점유 PID 확인
```

### 처방
```bash
lsof -ti:3000 | xargs kill -9      # 포트 점유 프로세스 강제 종료
pkill -9 -f "bin/vite"             # vite 바이너리 직접 타겟 (npm 래퍼 아님)
sleep 2
# 이후 단일 서버로 재기동, 프로세스 수 1개인지 확인
```

### 교훈
- `pkill -f "npm run dev"`만으론 부족. **`bin/vite` 바이너리**를 직접 종료해야 함.
- 재시작 전 `lsof -ti:3000`으로 포트가 비었는지 확인.
- "고쳤는데 안 변함" → 코드/설정뿐 아니라 **실행 중인 프로세스**도 의심.

---

## 14. Gutenberg 실제 텍스트 — Vite dev 프록시 해법

> [5번](#5-project-gutenberg-타임아웃--가짜-샘플-텍스트)의 공개 CORS 프록시가 불안정해 도달한 **최종 해법**.

### 문제
- gutenberg.org는 CORS 미지원 → 브라우저 직접 fetch 불가.
- 공개 프록시들이 모두 불안정:
  - `allorigins.win`: `error 520/522` (서버 다운) 빈번.
  - `corsproxy.io`: **유료화**.
  - `codetabs`: `400 Bad Request` (이 용도에 안 맞음).

### 해법 — Vite dev 서버 프록시
`vite.config.ts`에서 Vite가 직접 gutenberg.org로 프록시 (개발 환경 CORS 완전 우회):
```ts
server: {
  port: 3000,
  proxy: {
    '/gutenberg': {
      target: 'https://www.gutenberg.org',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/gutenberg/, ''),
    },
    '/gutendex': {
      target: 'https://gutendex.com',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/gutendex/, ''),
    },
  },
}
```
클라이언트는 상대경로로 호출:
```ts
// 브라우저 → Vite(:3000) → gutenberg.org (CORS 없음)
await fetch(`/gutenberg/cache/epub/${bookId}/pg${bookId}.txt`);
```
- 검증: `/gutenberg/cache/epub/161/pg161.txt` → 712,842 bytes 실제 책 ✅
- 공개 프록시는 **2순위 폴백**으로만 유지.

### 주의 (프로덕션)
- Vite 프록시는 **dev 서버 전용**. 프로덕션 빌드에는 적용 안 됨.
- 배포 시엔 자체 백엔드 프록시(Express/serverless) 또는 빌드 타임 사전 다운로드 필요.

### 교훈
- 불안정한 서드파티 프록시에 의존하지 말고, **개발 단계에선 Vite `server.proxy`**가 정석.
- 단, dev-only임을 명심하고 프로덕션 전략을 별도 수립.

---

## ✅ 재발 방지 체크리스트

코드 수정 후 "왜 안 되지?"가 반복되면 아래를 순서대로 점검:

1. **stale `.js` 확인** (가장 흔한 유령 버그) — `src`와 **루트 설정 파일 모두**:
   ```bash
   find src -name "*.js"               # 있으면 → find src -name "*.js" -delete
   ls vite.config.*                    # .js와 .ts 공존하면 → rm vite.config.js vite.config.d.ts
   # 주의: postcss.config.js, tailwind.config.js는 정상 파일 (.ts 짝 없음) → 보존
   ```
2. **유령 프로세스 확인** (`pkill -f "npm run dev"`로는 부족):
   ```bash
   ps aux | grep "bin/vite" | grep -v grep   # 1개 초과면 중복
   lsof -ti:3000 | xargs kill -9             # 포트 점유 강제 종료
   pkill -9 -f "bin/vite"
   ```
3. **`tsconfig.json`에 `"noEmit": true`** 있는지 (없으면 tsc가 src에 .js 재생성).
4. **Vite 캐시 제거 후 재시작** (설정 변경은 HMR 안 됨 → 완전 재시작):
   ```bash
   rm -rf node_modules/.vite && npm run dev
   ```
5. **Vite가 새 코드를 서빙하는지** 직접 확인:
   ```bash
   curl -s "http://localhost:3000/src/services/translationService.ts" | grep "mymemory"
   ```
6. **Vite 프록시 작동 확인** (응답 크기로 검증):
   ```bash
   curl -s "http://localhost:3000/gutenberg/cache/epub/161/pg161.txt" -o /tmp/t.txt -w "%{http_code}\n"
   wc -c /tmp/t.txt   # 수십만 bytes면 OK, 수백 bytes면 프록시 미적용(HTML 셸)
   ```
7. **떠도는 Service Worker 확인**: 콘솔에 SW 로그가 뜨는데 프로젝트에 SW가 없으면
   → DevTools → Application → Service Workers → Unregister (또는 main.tsx의 정리 코드).
8. **브라우저 하드 새로고침** (`Cmd+Shift+R`) + DevTools "Disable cache".
9. **외부 API는 `curl -I`로 CORS 헤더 먼저 확인** (`access-control-allow-origin`).
10. **콘솔 스택의 파일 확장자 확인**: `.js`인데 소스가 `.ts`면 → stale 파일 의심.
11. **큰 수정 후 `npx tsc --noEmit`로 타입 일괄 점검**.

### 핵심 교훈 5가지
- 🥇 **유령 버그의 90%는 stale 빌드 산출물**이었다. 소스를 고쳐도 안 바뀌면 빌드 캐시/컴파일 결과물부터 의심.
  → `src/*.js`, `vite.config.js` 등 **`.ts` 짝이 있는 `.js`는 전부 stale**.
- 🥈 **유령 프로세스/캐시도 의심하라**: 중복 vite 프로세스, 떠도는 Service Worker, `node_modules/.vite` 캐시.
- 🥉 **브라우저 직접 호출 + 서드파티 API = CORS 지옥**. 붙이기 전 헤더 검증, dev에선 Vite `server.proxy`.
- 🏅 **"동작한다"를 응답 내용으로 검증**하라. 200 OK가 곧 정상 데이터는 아니다(가짜 샘플/HTML 셸/에러페이지).
- 🏅 **설정 변경은 완전 재시작**. config는 HMR 대상이 아님. `localhost` 포트는 프로젝트마다 분리.

---

_최종 갱신: 2026-06-14_
