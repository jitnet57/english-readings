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

// 번역 캐시 (text+lang -> 번역)
const translationCache = new Map<string, string>();

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

/**
 * MyMemory API로 한 조각 번역
 */
async function translateChunk(chunk: string, targetLanguage: TargetLanguage): Promise<string> {
  const trimmed = chunk.trim();
  if (!trimmed) return chunk;

  const langpair = langPairMap[targetLanguage];
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${langpair}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`MyMemory API error: ${response.status}`);

  const data = await response.json();
  const translated = data?.responseData?.translatedText;

  if (!translated || typeof translated !== 'string') {
    throw new Error('MyMemory: no translation returned');
  }

  // 앞뒤 공백 보존
  const leadingSpace = chunk.match(/^\s*/)?.[0] || '';
  const trailingSpace = chunk.match(/\s*$/)?.[0] || '';
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
      // MyMemory 레이트 제한 회피
      if (chunks.length > 1) {
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    const result = translatedChunks.join('');
    translationCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Translation error:', error);
    // 실패 시 원문 반환 (엉터리 데모 번역 대신)
    return text;
  }
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
