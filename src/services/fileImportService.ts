/**
 * 파일 가져오기 — txt / md / pdf / hwp 에서 텍스트 추출
 */

import * as pdfjsLib from 'pdfjs-dist';
// Vite용 워커 (번들에 포함)
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type ImportResult = {
  title: string;
  text: string;
};

// 마크다운 기호 제거 → 평문
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '')        // 코드블록
    .replace(/`([^`]+)`/g, '$1')           // 인라인 코드
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')  // 이미지
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // 링크 → 텍스트
    .replace(/^#{1,6}\s+/gm, '')           // 헤더
    .replace(/^\s*>\s?/gm, '')             // 인용
    .replace(/^\s*[-*+]\s+/gm, '')         // 리스트
    .replace(/(\*\*|__|\*|_|~~)/g, '')     // 강조
    .trim();
}

async function parsePdf(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => (it.str ?? ''));
    parts.push(strings.join(' '));
  }
  return parts.join('\n\n');
}

/**
 * 파일에서 텍스트 추출
 */
export async function importFile(file: File): Promise<ImportResult> {
  const name = file.name;
  const lower = name.toLowerCase();
  const title = name.replace(/\.[^.]+$/, '');

  if (lower.endsWith('.txt')) {
    return { title, text: await file.text() };
  }
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) {
    return { title, text: stripMarkdown(await file.text()) };
  }
  if (lower.endsWith('.pdf')) {
    return { title, text: await parsePdf(file) };
  }
  if (lower.endsWith('.hwp') || lower.endsWith('.hwpx')) {
    // HWP는 독점 바이너리 포맷이라 브라우저에서 안정적 추출이 어려움
    throw new Error(
      'HWP 파일은 직접 지원이 어렵습니다. 한글에서 "다른 이름으로 저장 → PDF 또는 TXT"로 변환 후 올려주세요.'
    );
  }
  // 알 수 없는 확장자는 텍스트로 시도
  return { title, text: await file.text() };
}

// 추출 텍스트를 페이지로 분할 (단어 수 기준)
export function splitTextIntoPages(text: string, wordsPerPage = 300): string[] {
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const words = clean.split(/(\s+)/);
  const pages: string[] = [];
  let current = '';
  let wordCount = 0;
  for (const tok of words) {
    current += tok;
    if (tok.trim()) wordCount++;
    if (wordCount >= wordsPerPage && /\s/.test(tok)) {
      pages.push(current.trim());
      current = '';
      wordCount = 0;
    }
  }
  if (current.trim()) pages.push(current.trim());
  return pages.length > 0 ? pages : [clean];
}
