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

// Google gtx 대상 언어 코드 (en -> target)
const gtxLang: Record<TargetLanguage, string> = {
  ko: 'ko', ja: 'ja', zh: 'zh-CN', es: 'es', fr: 'fr',
  de: 'de', ru: 'ru', pt: 'pt', ar: 'ar', hi: 'hi',
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

// 1순위: Google 무료 gtx 엔드포인트 (한도 넉넉, CORS 지원, 키 불필요)
async function translateViaGoogle(text: string, targetLanguage: TargetLanguage): Promise<string | null> {
  const tl = gtxLang[targetLanguage];
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    // data[0] = [[translated, original, ...], ...]
    if (Array.isArray(data?.[0])) {
      const translated = data[0].map((seg: any[]) => (seg && seg[0]) || '').join('');
      return translated || null;
    }
  } catch {
    /* 실패 시 폴백 */
  }
  return null;
}

// 2순위: MyMemory (폴백, 이메일 한도 상향)
async function translateViaMyMemory(text: string, targetLanguage: TargetLanguage): Promise<string | null> {
  const langpair = langPairMap[targetLanguage];
  const url =
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}` +
    `&langpair=${langpair}&de=${encodeURIComponent(MYMEMORY_EMAIL)}`;
  try {
    const res = await fetch(url);
    if (res.status === 429) {
      rateLimitedUntil = Date.now() + 5 * 60_000; // 5분 쿨다운
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (data?.responseStatus === 429 || (typeof translated === 'string' && /MYMEMORY WARNING|YOU USED ALL/i.test(translated))) {
      rateLimitedUntil = Date.now() + 5 * 60_000;
      return null;
    }
    return typeof translated === 'string' ? translated : null;
  } catch {
    return null;
  }
}

/**
 * 한 조각 번역: Google gtx → MyMemory 폴백
 */
async function translateChunk(chunk: string, targetLanguage: TargetLanguage): Promise<string> {
  const trimmed = chunk.trim();
  if (!trimmed) return chunk;

  const leadingSpace = chunk.match(/^\s*/)?.[0] || '';
  const trailingSpace = chunk.match(/\s*$/)?.[0] || '';

  let translated = await translateViaGoogle(trimmed, targetLanguage);
  if (!translated && Date.now() >= rateLimitedUntil) {
    translated = await translateViaMyMemory(trimmed, targetLanguage);
  }
  if (!translated) throw new Error('Translation unavailable');

  return leadingSpace + translated + trailingSpace;
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

  try {
    const chunks = splitIntoChunks(text);
    const translatedChunks: string[] = [];

    for (const chunk of chunks) {
      const translated = await translateChunk(chunk, targetLanguage);
      translatedChunks.push(translated);
      if (chunks.length > 1) {
        await sleep(80);
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
