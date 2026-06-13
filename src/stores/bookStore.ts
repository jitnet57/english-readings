import { create } from 'zustand';
import { Book, ReadingProgress } from '@/types/book';

interface BookState {
  currentBook: Book | null;
  progress: ReadingProgress | null;
  showTranslation: boolean;

  setCurrentBook: (book: Book) => void;
  initProgress: (bookId: string) => void;
  updateCurrentSentence: (index: number) => void;
  updatePage: (page: number) => void;
  toggleTranslation: () => void;
  addBookmark: (sentenceId: string) => void;
  removeBookmark: (sentenceId: string) => void;
}

export const useBookStore = create<BookState>((set) => ({
  currentBook: null,
  progress: null,
  showTranslation: true,

  setCurrentBook: (book) => set({ currentBook: book }),

  initProgress: (bookId) =>
    set((state) => {
      if (state.progress?.bookId === bookId) return state;
      return {
        progress: {
          bookId,
          currentSentenceIndex: 0,
          currentPage: 1,
          totalTimeSpent: 0,
          lastReadAt: new Date().toISOString(),
          bookmarks: [],
        },
      };
    }),

  updateCurrentSentence: (index) =>
    set((state) => {
      if (!state.progress) return state;
      return {
        progress: {
          ...state.progress,
          currentSentenceIndex: index,
          lastReadAt: new Date().toISOString(),
        },
      };
    }),

  updatePage: (page) =>
    set((state) => {
      if (!state.progress) return state;
      return {
        progress: {
          ...state.progress,
          currentPage: page,
        },
      };
    }),

  toggleTranslation: () =>
    set((state) => ({
      showTranslation: !state.showTranslation,
    })),

  addBookmark: (sentenceId) =>
    set((state) => {
      if (!state.progress) return state;
      return {
        progress: {
          ...state.progress,
          bookmarks: [...state.progress.bookmarks, sentenceId],
        },
      };
    }),

  removeBookmark: (sentenceId) =>
    set((state) => {
      if (!state.progress) return state;
      return {
        progress: {
          ...state.progress,
          bookmarks: state.progress.bookmarks.filter((id) => id !== sentenceId),
        },
      };
    }),
}));
