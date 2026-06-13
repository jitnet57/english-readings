import { Book } from '@/types/book';

export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_id?: number;
  isbn?: string[];
}

export interface OpenLibrarySearchResult {
  docs: OpenLibraryBook[];
  numFound: number;
}

const OPENLIBRARY_API = 'https://openlibrary.org/search.json';
const COVER_BASE_URL = 'https://covers.openlibrary.org/b/id';

export async function searchBooks(query: string, limit: number = 10): Promise<Book[]> {
  try {
    const response = await fetch(
      `${OPENLIBRARY_API}?title=${encodeURIComponent(query)}&limit=${limit}`
    );
    const data: OpenLibrarySearchResult = await response.json();

    return data.docs
      .filter((doc) => doc.title && doc.author_name)
      .map((doc) => convertOpenLibraryToBook(doc));
  } catch (error) {
    console.error('Error searching Open Library:', error);
    return [];
  }
}

export async function searchByAuthor(author: string, limit: number = 10): Promise<Book[]> {
  try {
    const response = await fetch(
      `${OPENLIBRARY_API}?author=${encodeURIComponent(author)}&limit=${limit}`
    );
    const data: OpenLibrarySearchResult = await response.json();

    return data.docs
      .filter((doc) => doc.title && doc.author_name)
      .map((doc) => convertOpenLibraryToBook(doc));
  } catch (error) {
    console.error('Error searching by author:', error);
    return [];
  }
}

export async function getBooksByLevel(level: 'beginner' | 'intermediate' | 'advanced'): Promise<Book[]> {
  // Search for popular books in each difficulty level
  const queries: Record<string, string> = {
    beginner: 'simple stories english',
    intermediate: 'classic literature fiction',
    advanced: 'philosophy literature complex',
  };

  try {
    const response = await fetch(`${OPENLIBRARY_API}?q=${encodeURIComponent(queries[level])}&limit=20`);
    const data: OpenLibrarySearchResult = await response.json();

    return data.docs
      .filter((doc) => doc.title && doc.author_name)
      .slice(0, 10)
      .map((doc) => convertOpenLibraryToBook(doc, level));
  } catch (error) {
    console.error('Error getting books by level:', error);
    return [];
  }
}

function convertOpenLibraryToBook(doc: OpenLibraryBook, level?: string): Book {
  const coverUrl = doc.cover_id
    ? `${COVER_BASE_URL}/${doc.cover_id}-M.jpg`
    : 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=200&h=300&fit=crop';

  // Determine level based on publication year if not provided
  let bookLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  if (level && ['beginner', 'intermediate', 'advanced'].includes(level)) {
    bookLevel = level as 'beginner' | 'intermediate' | 'advanced';
  } else if (doc.first_publish_year) {
    if (doc.first_publish_year > 2000) {
      bookLevel = 'beginner';
    } else if (doc.first_publish_year > 1900) {
      bookLevel = 'intermediate';
    } else {
      bookLevel = 'advanced';
    }
  }

  return {
    id: `openlibrary-${doc.key}`,
    title: doc.title,
    author: doc.author_name?.[0] || 'Unknown',
    level: bookLevel,
    coverUrl,
    description: `Published in ${doc.first_publish_year || 'Unknown'}. Available from Open Library.`,
    sentences: [
      {
        id: '1',
        pageNumber: 1,
        enText: 'This book is available from Open Library. Click to explore more content.',
        koText: '이 책은 Open Library에서 이용 가능합니다. 더 많은 내용을 탐색하려면 클릭하세요.',
      },
    ],
  };
}

export async function searchByISBN(isbn: string): Promise<Book | null> {
  try {
    const response = await fetch(`${OPENLIBRARY_API}?isbn=${encodeURIComponent(isbn)}`);
    const data: OpenLibrarySearchResult = await response.json();

    if (data.docs.length > 0) {
      return convertOpenLibraryToBook(data.docs[0]);
    }
    return null;
  } catch (error) {
    console.error('Error searching by ISBN:', error);
    return null;
  }
}
