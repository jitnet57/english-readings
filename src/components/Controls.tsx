import { useBookStore } from '@/stores/bookStore';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Bookmark, BookmarkCheck } from 'lucide-react';

interface ControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isBookmarked: boolean;
  onBookmark: () => void;
}

export function Controls({
  onPrevious,
  onNext,
  canGoBack,
  canGoNext,
  isBookmarked,
  onBookmark,
}: ControlsProps) {
  const { showTranslation, toggleTranslation } = useBookStore();

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-gray-100 border-t border-gray-300">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevious}
          disabled={!canGoBack}
          className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Previous page"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Next page"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTranslation}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 transition"
          title={showTranslation ? 'Hide translation' : 'Show translation'}
        >
          {showTranslation ? (
            <>
              <Eye size={18} />
              <span className="text-sm">번역 보기</span>
            </>
          ) : (
            <>
              <EyeOff size={18} />
              <span className="text-sm">번역 숨기기</span>
            </>
          )}
        </button>

        <button
          onClick={onBookmark}
          className={`p-2 rounded-lg transition ${
            isBookmarked
              ? 'bg-yellow-200 hover:bg-yellow-300'
              : 'hover:bg-gray-200'
          }`}
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          {isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
        </button>
      </div>
    </div>
  );
}
