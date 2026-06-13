import { useEffect, useState } from 'react';
import { useBookStore } from '@/stores/bookStore';
import { Book } from '@/types/book';
import { Controls } from './Controls';
import { TTSButton } from './TTSButton';
import { WordPopover } from './WordPopover';
import { getWordDefinition } from '@/data/dictionary';
import { ChevronLeft } from 'lucide-react';

interface BookReaderProps {
  book: Book;
  onBack?: () => void;
}

export function BookReader({ book, onBack }: BookReaderProps) {
  const {
    progress,
    showTranslation,
    setCurrentBook,
    initProgress,
    updateCurrentSentence,
    addBookmark,
    removeBookmark,
  } = useBookStore();

  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    setCurrentBook(book);
    initProgress(book.id);
  }, [book, setCurrentBook, initProgress]);

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) {
        return;
      }

      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (selectedText.length > 0) {
        setSelectedWord({
          word: selectedText,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  if (!progress) {
    return <div>Loading...</div>;
  }

  const currentSentenceIndex = progress.currentSentenceIndex;
  const currentSentence = book.sentences[currentSentenceIndex];
  const isBookmarked = progress.bookmarks.includes(currentSentence.id);

  const handlePrevious = () => {
    if (currentSentenceIndex > 0) {
      updateCurrentSentence(currentSentenceIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSentenceIndex < book.sentences.length - 1) {
      updateCurrentSentence(currentSentenceIndex + 1);
    }
  };

  const handleBookmark = () => {
    if (isBookmarked) {
      removeBookmark(currentSentence.id);
    } else {
      addBookmark(currentSentence.id);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-300 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-blue-700 rounded-lg transition"
                title="Back to books"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold">{book.title}</h1>
              <p className="text-sm opacity-90">by {book.author}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* English Text */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between gap-4 mb-3">
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                English
              </h2>
              <TTSButton text={currentSentence.enText} />
            </div>
            <p className="text-lg leading-8 text-gray-900 select-text bg-yellow-100 p-4 rounded">
              {currentSentence.enText}
            </p>
          </div>

          {/* Korean Translation */}
          {showTranslation && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border-l-4 border-green-500">
              <h2 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">
                Korean
              </h2>
              <p className="text-lg leading-8 text-gray-900">{currentSentence.koText}</p>
            </div>
          )}

          {/* Progress Info */}
          <div className="mt-12 text-center text-gray-500">
            <p className="text-sm">
              Page {currentSentence.pageNumber} • Sentence {currentSentenceIndex + 1} of{' '}
              {book.sentences.length}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Controls
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoBack={currentSentenceIndex > 0}
        canGoNext={currentSentenceIndex < book.sentences.length - 1}
        isBookmarked={isBookmarked}
        onBookmark={handleBookmark}
      />

      {/* Word Popover */}
      {selectedWord && (
        <WordPopover
          word={selectedWord.word}
          definition={getWordDefinition(selectedWord.word)}
          x={selectedWord.x}
          y={selectedWord.y}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}
