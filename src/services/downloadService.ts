/**
 * 간단한 메모리 기반 저장소 (IndexedDB 제거)
 */

const memoryBooks = new Map<number, any>();
const memoryTranslations = new Map<string, any>();

export interface DownloadedBook {
  id: number;
  title: string;
  author: string;
  content: string;
  pages: string[];
  downloadedAt: number;
  size: number;
}

export interface TranslatedBook {
  id: string;
  bookId: number;
  language: string;
  pages: string[];
  translatedAt: number;
  progress: number;
}

export async function initDB() {
  return {} as any;
}

export async function downloadBook(
  bookId: number,
  title: string,
  author: string,
  content: string,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    const pageSize = 2000;
    const pages: string[] = [];
    for (let i = 0; i < content.length; i += pageSize) {
      pages.push(content.substring(i, i + pageSize));
    }

    const book: DownloadedBook = {
      id: bookId,
      title,
      author,
      content,
      pages,
      downloadedAt: Date.now(),
      size: content.length,
    };

    memoryBooks.set(bookId, book);
    onProgress?.(100);
    return true;
  } catch (error) {
    console.error('Error downloading book:', error);
    return false;
  }
}

export async function getDownloadedBook(bookId: number): Promise<DownloadedBook | null> {
  return memoryBooks.get(bookId) || null;
}

export async function getAllDownloadedBooks(): Promise<DownloadedBook[]> {
  return Array.from(memoryBooks.values());
}

export async function deleteDownloadedBook(bookId: number): Promise<boolean> {
  memoryBooks.delete(bookId);
  return true;
}

export async function getTotalDownloadSize(): Promise<number> {
  const books = Array.from(memoryBooks.values());
  return books.reduce((sum, book) => sum + book.size, 0);
}

export function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2) + ' MB';
}

export async function saveTranslatedPage(
  bookId: number,
  language: string,
  pageIndex: number,
  translatedContent: string,
  totalPages: number
): Promise<boolean> {
  try {
    const key = `${bookId}_${language}`;
    const existing = memoryTranslations.get(key);
    const pages = existing?.pages || Array(totalPages).fill('');
    pages[pageIndex] = translatedContent;

    const translatedBook: TranslatedBook = {
      id: key,
      bookId,
      language,
      pages,
      translatedAt: Date.now(),
      progress: Math.round((pages.filter((p: string) => p.length > 0).length / totalPages) * 100),
    };

    memoryTranslations.set(key, translatedBook);
    return true;
  } catch (error) {
    console.error('Error saving translated page:', error);
    return false;
  }
}

export async function getTranslatedBook(
  bookId: number,
  language: string
): Promise<TranslatedBook | null> {
  try {
    const key = `${bookId}_${language}`;
    return memoryTranslations.get(key) || null;
  } catch (error) {
    console.error('Error getting translated book:', error);
    return null;
  }
}

export async function getAllTranslations(bookId: number): Promise<TranslatedBook[]> {
  try {
    return Array.from(memoryTranslations.values()).filter(
      (t) => t.bookId === bookId
    );
  } catch (error) {
    console.error('Error getting all translations:', error);
    return [];
  }
}

export async function deleteTranslation(bookId: number, language: string): Promise<boolean> {
  try {
    const key = `${bookId}_${language}`;
    memoryTranslations.delete(key);
    return true;
  } catch (error) {
    console.error('Error deleting translation:', error);
    return false;
  }
}
