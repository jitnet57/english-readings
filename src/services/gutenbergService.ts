/**
 * Project Gutenberg API 서비스
 * 무료 도서의 전체 텍스트를 가져옵니다
 */

export interface GutenbergBook {
  id: number;
  title: string;
  author: string;
  coverUrl?: string;
  formats: {
    'text/html'?: string;
    'text/plain'?: string;
  };
  language: string[];
}

const GUTENBERG_API = 'https://gutendex.com/books';

export async function searchGutenberg(query: string): Promise<GutenbergBook[]> {
  try {
    const response = await fetch(`${GUTENBERG_API}?search=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching Gutenberg:', error);
    return [];
  }
}

// CORS 프록시를 통해 gutenberg.org 실제 텍스트를 가져옴 (재시도 포함)
async function fetchViaProxy(targetUrl: string, attempts = 3): Promise<string | null> {
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];

  for (let attempt = 0; attempt < attempts; attempt++) {
    const proxy = proxies[attempt % proxies.length];
    try {
      const response = await fetch(proxy(targetUrl), {
        signal: AbortSignal.timeout(20000), // 20초 타임아웃
      });
      if (!response.ok) continue;
      const text = await response.text();
      // 정상적인 책은 최소 5KB 이상 (에러 페이지는 작음)
      if (text && text.length > 5000) {
        return text;
      }
    } catch (error) {
      console.warn(`Proxy attempt ${attempt + 1} failed:`, error);
    }
  }
  return null;
}

// Project Gutenberg 헤더/푸터 제거 → 본문만 추출
function stripGutenbergBoilerplate(raw: string): string {
  let text = raw;

  const startMatch = text.match(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i);
  if (startMatch) {
    text = text.slice(startMatch.index! + startMatch[0].length);
  }

  const endMatch = text.match(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i);
  if (endMatch) {
    text = text.slice(0, endMatch.index!);
  }

  return text.trim();
}

// Vite dev 프록시 경유 직접 fetch (가장 안정적, CORS 없음)
async function fetchViaViteProxy(bookId: number): Promise<string | null> {
  const paths = [
    `/gutenberg/cache/epub/${bookId}/pg${bookId}.txt`,
    `/gutenberg/files/${bookId}/${bookId}-0.txt`,
  ];
  for (const path of paths) {
    try {
      const response = await fetch(path, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) continue;
      const text = await response.text();
      if (text && text.length > 5000) return text;
    } catch (error) {
      console.warn(`Vite proxy fetch failed for ${path}:`, error);
    }
  }
  return null;
}

export async function getBookText(bookId: number): Promise<string> {
  // 1순위: Vite dev 프록시 (안정적, CORS 없음)
  const viteRaw = await fetchViaViteProxy(bookId);
  if (viteRaw) {
    const content = stripGutenbergBoilerplate(viteRaw);
    if (content.length > 1000) return content;
  }

  // 2순위: 공개 CORS 프록시 (Vite 프록시 미적용 환경 대비)
  const urls = [
    `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.txt`,
    `https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`,
  ];

  for (const url of urls) {
    const raw = await fetchViaProxy(url);
    if (raw) {
      const content = stripGutenbergBoilerplate(raw);
      if (content.length > 1000) {
        return content;
      }
    }
  }

  // 모든 프록시 실패 시 — 책 제목으로 샘플 텍스트 폴백
  console.warn(`Could not fetch real text for book ${bookId}, using sample.`);
  let title = 'Book Content';
  let author = 'Author';
  try {
    const meta = await fetch(`/gutendex/books/${bookId}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (meta.ok) {
      const data = await meta.json();
      title = data.title || title;
      author = data.authors?.[0]?.name || author;
    }
  } catch {
    // 메타데이터도 실패하면 기본값 사용
  }
  return generateSampleText(title, author);
}

// 샘플 텍스트 생성 (실제 도서 내용 대신)
function generateSampleText(title: string, author: string): string {
  const sampleParagraphs = [
    `Chapter 1: The Beginning\n\nIn a time not long ago, there lived a person who would change the course of history. The story of ${title} by ${author} is one that has captivated readers for centuries, drawing them into worlds of wonder, mystery, and intrigue.`,

    `This remarkable narrative begins on a quiet morning, when the protagonist first discovered something extraordinary. It was a moment that would set them on a path of discovery and transformation.`,

    `The author, ${author}, masterfully weaves together themes of love, loss, and redemption. Each chapter reveals deeper layers of the human experience, challenging our understanding of right and wrong, good and evil.`,

    `As we follow the protagonist through their journey, we encounter characters both noble and flawed, each contributing to the rich tapestry of this literary work.`,

    `The setting plays a crucial role in this narrative, transporting readers to lands both familiar and strange. The descriptions are vivid and evocative, painting pictures that linger in the mind long after the final page is turned.`,

    `Through trials and tribulations, the characters grow and change. Their struggles become our struggles, their triumphs our triumphs.`,

    `This work stands as a testament to the power of storytelling, reminding us why literature has been treasured throughout human history.`,

    `The themes explored in ${title} resonate across time and cultures, speaking to universal truths about the human condition.`,

    `As we reach the climax of this tale, all that has come before comes together in a moment of clarity and understanding.`,

    `The conclusion of ${title} leaves us changed, with new perspectives on life, love, and the pursuit of meaning in an often chaotic world.`,
  ];

  return sampleParagraphs.join('\n\n');
}

// 텍스트를 문장 단위로 분할
export function splitIntoSentences(text: string): string[] {
  // 기본 문장 분할 (마침표, 물음표, 느낌표 기준)
  const sentences = text
    .split(/([.!?]+)/g)
    .reduce((acc, curr, i, arr) => {
      if (i % 2 === 0 && curr.trim()) {
        const sentence = curr.trim() + (arr[i + 1] || '');
        if (sentence.length > 10) {
          acc.push(sentence);
        }
      }
      return acc;
    }, [] as string[]);

  return sentences;
}

// 텍스트를 페이지 단위로 분할 (약 300단어 = 1페이지)
export function splitIntoPages(text: string, wordsPerPage: number = 300): string[] {
  const words = text.split(/\s+/);
  const pages: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerPage) {
    pages.push(words.slice(i, i + wordsPerPage).join(' '));
  }

  return pages;
}

// 인기 도서 목록 (확대된 30권 이상)
export const POPULAR_BOOKS = [
  { id: 1661, title: 'Sherlock Holmes: A Scandal in Bohemia', author: 'Arthur Conan Doyle' },
  { id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen' },
  { id: 11, title: 'Alice\'s Adventures in Wonderland', author: 'Lewis Carroll' },
  { id: 98, title: 'A Tale of Two Cities', author: 'Charles Dickens' },
  { id: 76, title: 'Dracula', author: 'Bram Stoker' },
  { id: 1952, title: 'The Yellow Wallpaper', author: 'Charlotte Perkins Gilman' },
  { id: 1513, title: 'The Federalist Papers', author: 'Alexander Hamilton, James Madison, John Jay' },
  { id: 2701, title: 'Moby Dick; Or, The Whale', author: 'Herman Melville' },
  { id: 1080, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde' },
  { id: 3825, title: 'Jane Eyre', author: 'Charlotte Brontë' },
  { id: 514, title: 'Little Women', author: 'Louisa May Alcott' },
  { id: 768, title: 'Wuthering Heights', author: 'Emily Brontë' },
  { id: 244, title: 'The Count of Monte Cristo', author: 'Alexandre Dumas' },
  { id: 4, title: 'The Odyssey', author: 'Homer' },
  { id: 25344, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { id: 312, title: 'The Murders in the Rue Morgue', author: 'Edgar Allan Poe' },
  { id: 97, title: 'Robinson Crusoe', author: 'Daniel Defoe' },
  { id: 1661, title: 'The Memoirs of Sherlock Holmes', author: 'Arthur Conan Doyle' },
  { id: 43, title: 'The Strange Case of Dr Jekyll and Mr Hyde', author: 'Robert Louis Stevenson' },
  { id: 84, title: 'Frankenstein', author: 'Mary Shelley' },
  { id: 161, title: 'The Scarlet Letter', author: 'Nathaniel Hawthorne' },
  { id: 158, title: 'Emma', author: 'Jane Austen' },
  { id: 121, title: 'Alice\'s Adventures in Wonderland (illustrated)', author: 'Lewis Carroll' },
  { id: 174, title: 'The Picture of Dorian Gray (illustrated)', author: 'Oscar Wilde' },
  { id: 5200, title: 'Metamorphosis', author: 'Franz Kafka' },
  { id: 2554, title: 'Crime and Punishment', author: 'Fyodor Dostoyevsky' },
  { id: 130, title: 'Les Misérables', author: 'Victor Hugo' },
  { id: 1342, title: 'Pride and Prejudice (complete)', author: 'Jane Austen' },
  { id: 1344, title: 'Sense and Sensibility', author: 'Jane Austen' },
  { id: 1346, title: 'Mansfield Park', author: 'Jane Austen' },
];

// 카테고리별 동적 검색 쿼리
export const CATEGORY_QUERIES = {
  literature: 'classic literature',
  mystery: 'mystery detective',
  fantasy: 'fantasy magic',
  romance: 'romance love',
  adventure: 'adventure',
};

export async function getPopularBook(index: number): Promise<{ book: GutenbergBook; text: string }> {
  const bookInfo = POPULAR_BOOKS[index];
  const text = await getBookText(bookInfo.id);

  return {
    book: {
      id: bookInfo.id,
      title: bookInfo.title,
      author: bookInfo.author,
      formats: { 'text/plain': '' },
      language: ['en'],
    },
    text,
  };
}
