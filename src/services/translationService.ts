/**
 * 실제 번역 서비스 — MyMemory API 사용 (무료, CORS 지원, API 키 불필요)
 */

export type TargetLanguage = 'ko' | 'ja' | 'zh' | 'es' | 'fr' | 'de' | 'ru' | 'pt' | 'ar' | 'hi';
export type TranslationAPI = 'mymemory' | 'demo';

export interface TranslationResult {
  original: string;
  translated: string;
  language: TargetLanguage;
}

// 번역 캐시 (text+lang -> 번역) — localStorage에 영구 저장
const CACHE_KEY = 'ewa:translationCache';
const translationCache = new Map<string, string>(loadCache());

// MyMemory 한도 상향용 이메일 (익명 1000단어/일 → 약 50000단어/일)
const MYMEMORY_EMAIL = 'digitalm.2nd@gmail.com';

function loadCache(): [string, string][] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as [string, string][]) : [];
  } catch {
    return [];
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persistCache() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      // 너무 커지지 않도록 최근 3000개만 보관
      const entries = Array.from(translationCache.entries()).slice(-3000);
      localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch {
      /* 용량 초과 등 무시 */
    }
  }, 500);
}

export const SUPPORTED_LANGUAGES: Record<TargetLanguage, string> = {
  ko: '🇰🇷 한국어',
  ja: '🇯🇵 日本語',
  zh: '🇨🇳 中文',
  es: '🇪🇸 Español',
  fr: '🇫🇷 Français',
  de: '🇩🇪 Deutsch',
  ru: '🇷🇺 Русский',
  pt: '🇵🇹 Português',
  ar: '🇸🇦 العربية',
  hi: '🇮🇳 हिन्दी',
};

// MyMemory langpair 코드 (en -> target)
const langPairMap: Record<TargetLanguage, string> = {
  ko: 'en|ko',
  ja: 'en|ja',
  zh: 'en|zh-CN',
  es: 'en|es',
  fr: 'en|fr',
  de: 'en|de',
  ru: 'en|ru',
  pt: 'en|pt',
  ar: 'en|ar',
  hi: 'en|hi',
};

/**
 * 긴 텍스트를 MyMemory 길이 제한(~450자)에 맞춰 문장 단위로 분할
 */
function splitIntoChunks(text: string, maxLen = 450): string[] {
  // 문장 경계(. ! ?)로 분리하되 구분자 유지
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen) {
      if (current) chunks.push(current);
      // 한 문장이 maxLen보다 길면 강제로 자름
      if (sentence.length > maxLen) {
        for (let i = 0; i < sentence.length; i += maxLen) {
          chunks.push(sentence.slice(i, i + maxLen));
        }
        current = '';
      } else {
        current = sentence;
      }
    } else {
      current += sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// 한도 초과(429) 상태를 잠시 기억해 폭주 방지
let rateLimitedUntil = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * MyMemory API로 한 조각 번역 (429 재시도 + 이메일 한도 상향)
 */
async function translateChunk(chunk: string, targetLanguage: TargetLanguage): Promise<string> {
  const trimmed = chunk.trim();
  if (!trimmed) return chunk;

  const langpair = langPairMap[targetLanguage];
  const url =
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}` +
    `&langpair=${langpair}&de=${encodeURIComponent(MYMEMORY_EMAIL)}`;

  const leadingSpace = chunk.match(/^\s*/)?.[0] || '';
  const trailingSpace = chunk.match(/\s*$/)?.[0] || '';

  // 최대 3회: 429면 지수 백오프 후 재시도
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url);

    if (response.status === 429) {
      rateLimitedUntil = Date.now() + 60_000; // 1분간 한도 초과로 간주
      await sleep(1000 * (attempt + 1));
      continue;
    }
    if (!response.ok) throw new Error(`MyMemory API error: ${response.status}`);

    const data = await response.json();
    const translated = data?.responseData?.translatedText;
    const status = data?.responseStatus;

    // 본문에 한도 메시지가 담겨 오는 경우 처리
    if (status === 429 || (typeof translated === 'string' && /MYMEMORY WARNING|YOU USED ALL/i.test(translated))) {
      rateLimitedUntil = Date.now() + 60_000;
      throw new Error('MyMemory rate limited');
    }
    if (!translated || typeof translated !== 'string') {
      throw new Error('MyMemory: no translation returned');
    }
    return leadingSpace + translated + trailingSpace;
  }
  throw new Error('MyMemory rate limited (429)');
}

/**
 * 텍스트 번역 (실제 번역)
 */
export async function translateText(
  text: string,
  targetLanguage: TargetLanguage = 'ko',
  _apiType: TranslationAPI = 'mymemory'
): Promise<string> {
  if (!text || !text.trim()) return text;

  const cacheKey = `${targetLanguage}|${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // 최근에 한도 초과했으면 잠시 호출 자체를 건너뜀 (폭주 방지)
  if (Date.now() < rateLimitedUntil) {
    return text;
  }

  try {
    const chunks = splitIntoChunks(text);
    const translatedChunks: string[] = [];

    for (const chunk of chunks) {
      const translated = await translateChunk(chunk, targetLanguage);
      translatedChunks.push(translated);
      if (chunks.length > 1) {
        await sleep(200);
      }
    }

    const result = translatedChunks.join('');
    translationCache.set(cacheKey, result);
    persistCache();
    return result;
  } catch (error) {
    console.error('Translation error:', error);
    // 실패 시 원문 반환 (엉터리 데모 번역 대신)
    return text;
  }
}

// 현재 한도 초과 상태인지 (UI 안내용)
export function isRateLimited(): boolean {
  return Date.now() < rateLimitedUntil;
}

export async function translateSentence(
  sentence: string,
  targetLanguage: TargetLanguage = 'ko',
  apiType: TranslationAPI = 'mymemory'
): Promise<string> {
  return translateText(sentence, targetLanguage, apiType);
}

export async function translatePage(
  pageContent: string,
  targetLanguage: TargetLanguage = 'ko',
  apiType: TranslationAPI = 'mymemory'
): Promise<string> {
  return translateText(pageContent, targetLanguage, apiType);
}
