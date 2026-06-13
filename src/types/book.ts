export interface Sentence {
  id: string;
  pageNumber: number;
  enText: string;
  koText: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  coverUrl?: string;
  description: string;
  sentences: Sentence[];
}

export interface ReadingProgress {
  bookId: string;
  currentSentenceIndex: number;
  currentPage: number;
  totalTimeSpent: number;
  lastReadAt: string;
  bookmarks: string[];
}
