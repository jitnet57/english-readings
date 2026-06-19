/**
 * 독서 상태 저장소 (localStorage)
 * - 마지막 읽은 책/페이지 (이어 읽기)
 * - 책별 진행 위치
 * - 메모 클립
 */

export interface LastRead {
  bookId: number;
  title: string;
  author: string;
  page: number;
  totalPages: number;
  savedAt: number;
}

export interface Memo {
  id: string;
  bookId: number;
  bookTitle: string;
  page: number;
  text: string;
  translation?: string; // 선택 텍스트의 해석
  note: string;
  createdAt: number;
}

const LAST_READ_KEY = 'ewa:lastRead';
const MEMOS_KEY = 'ewa:memos';
const progressKey = (bookId: number) => `ewa:progress:${bookId}`;

// ── 북커버 URL (Gutenberg 표지, Vite/Vercel 프록시 경유) ──
export function coverUrl(bookId: number): string {
  return `/gutenberg/cache/epub/${bookId}/pg${bookId}.cover.medium.jpg`;
}

// ── 마지막 읽은 책 (이어 읽기) ──
export function saveLastRead(r: LastRead): void {
  try {
    localStorage.setItem(LAST_READ_KEY, JSON.stringify(r));
  } catch (e) {
    console.warn('saveLastRead failed', e);
  }
}

export function getLastRead(): LastRead | null {
  try {
    const raw = localStorage.getItem(LAST_READ_KEY);
    return raw ? (JSON.parse(raw) as LastRead) : null;
  } catch {
    return null;
  }
}

// ── 책별 진행 위치 ──
export function saveProgress(bookId: number, page: number): void {
  try {
    localStorage.setItem(progressKey(bookId), String(page));
  } catch (e) {
    console.warn('saveProgress failed', e);
  }
}

export function getProgress(bookId: number): number {
  const raw = localStorage.getItem(progressKey(bookId));
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// ── 메모 클립 ──
export function getMemos(): Memo[] {
  try {
    const raw = localStorage.getItem(MEMOS_KEY);
    return raw ? (JSON.parse(raw) as Memo[]) : [];
  } catch {
    return [];
  }
}

export function addMemo(memo: Omit<Memo, 'id' | 'createdAt'>): Memo {
  const memos = getMemos();
  const newMemo: Memo = {
    ...memo,
    id: `${memo.bookId}-${memo.page}-${memos.length}-${Math.floor(performance.now())}`,
    createdAt: Date.now(),
  };
  memos.unshift(newMemo);
  localStorage.setItem(MEMOS_KEY, JSON.stringify(memos));
  return newMemo;
}

export function deleteMemo(id: string): void {
  const memos = getMemos().filter((m) => m.id !== id);
  localStorage.setItem(MEMOS_KEY, JSON.stringify(memos));
}

export function getMemosForBook(bookId: number): Memo[] {
  return getMemos().filter((m) => m.bookId === bookId);
}
