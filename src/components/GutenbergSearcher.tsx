import { useState, useEffect } from 'react';
import { Search, Loader, Download, Check } from 'lucide-react';
import { getBookText, splitIntoPages } from '@/services/gutenbergService';
import { downloadBook, getAllDownloadedBooks } from '@/services/downloadService';
import { searchBooksIndex, getPopularBooks } from '@/data/booksDatabase';
import type { BookIndex } from '@/data/booksDatabase';
import { PageFlipReader } from './PageFlipReader';
import { coverUrl } from '@/services/readingStore';

interface GutenbergSearcherProps {
  onBack: () => void;
  selectedBook?: any;
}

export function GutenbergSearcher({ onBack, selectedBook: initialBook }: GutenbergSearcherProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<BookIndex[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookIndex | null>(null);
  const [bookPages, setBookPages] = useState<string[]>([]);
  const [loadingText, setLoadingText] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedBooks, setDownloadedBooks] = useState<Set<number>>(new Set());

  // 초기 로드: 다운로드된 도서 확인 및 추천 도서 자동 로드
  useEffect(() => {
    const loadDownloadedBooks = async () => {
      const books = await getAllDownloadedBooks();
      setDownloadedBooks(new Set(books.map(b => b.id)));
    };
    loadDownloadedBooks();
  }, []);

  // 공통 책 로더: 실시간 다운로드 진행률 + 페이지 준비 즉시 읽기 시작 (저장은 백그라운드)
  const loadBook = async (book: BookIndex) => {
    setSelectedBook(book);
    setLoadingText(true);
    setDownloadProgress(0);

    try {
      // 실제 다운로드 진행률을 스트리밍으로 표시
      const text = await getBookText(book.id, (percent) => setDownloadProgress(percent));
      const pages = splitIntoPages(text, 400); // 400단어 = 1페이지

      // ⚡ 페이지가 준비되는 즉시 읽기 시작 (전체 저장을 기다리지 않음)
      setBookPages(pages);
      setDownloadProgress(100);
      setLoadingText(false);

      // 기기 저장은 백그라운드에서 진행 (읽기를 막지 않음)
      downloadBook(book.id, book.title, book.author, text)
        .then((success) => {
          if (success) {
            setDownloadedBooks(prev => new Set(prev).add(book.id));
          }
        })
        .catch((err) => console.warn('Background save failed:', err));
    } catch (error) {
      console.error('Error loading book:', error);
      alert('책을 로드하는 데 실패했습니다. 다른 책을 시도해보세요.');
      setSelectedBook(null);
      setLoadingText(false);
    }
  };

  // 추천 도서가 선택되면 자동 로드
  useEffect(() => {
    if (initialBook && !selectedBook) {
      loadBook(initialBook);
    }
  }, [initialBook]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    // 우리 데이터베이스에서 검색
    const books = searchBooksIndex(searchQuery);
    setResults(books.slice(0, 50)); // 최대 50개 결과 표시
    setLoading(false);
  };

  const handleSelectBook = (book: BookIndex) => loadBook(book);

  // 책 로딩 중
  if (selectedBook && loadingText) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📥 책을 다운로드 중입니다...</h2>
          <p className="text-gray-600 mb-6">{selectedBook.title}</p>

          {/* Download Progress */}
          <div className="w-72 mx-auto">
            <div className="h-3 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-200"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{downloadProgress}% 다운로드됨</span>
              <span className="font-medium">{downloadProgress >= 100 ? '✅ 완료' : '내려받는 중'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-3">⚡ 다운로드가 끝나면 바로 읽기가 시작됩니다</p>
          </div>
        </div>
      </div>
    );
  }

  // 책 읽기 중
  if (selectedBook && bookPages.length > 0) {
    return (
      <PageFlipReader
        bookId={selectedBook.id}
        title={selectedBook.title}
        author={selectedBook.author}
        pages={bookPages}
        onBack={() => {
          setSelectedBook(null);
          setBookPages([]);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-2xl hover:opacity-80 transition"
          >
            ←
          </button>
          <div>
            <h1 className="text-4xl font-bold">📚 도서 검색</h1>
            <p className="text-sm opacity-90">Project Gutenberg - 70,000+ 무료 도서</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="책 제목이나 저자 검색... (예: Pride and Prejudice, Jane Austen)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition font-medium"
              >
                {loading ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>
        </form>

        {/* Popular Books */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">⭐ 우리 도서관의 인기 도서</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {getPopularBooks(20).map((book) => (
              <button
                key={book.id}
                onClick={() => handleSelectBook(book)}
                className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition relative group"
              >
                {/* 북커버 (로드 실패 시 이모지 폴백) */}
                <div className="w-full h-40 mb-2 rounded overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                  <img
                    src={coverUrl(book.id)}
                    alt={book.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const t = e.currentTarget;
                      t.style.display = 'none';
                      (t.nextElementSibling as HTMLElement).style.display = 'flex';
                    }}
                  />
                  <div className="text-4xl w-full h-full items-center justify-center" style={{ display: 'none' }}>📖</div>
                </div>
                <h3 className="font-bold text-sm line-clamp-2 mb-1">{book.title}</h3>
                <p className="text-xs text-gray-600">{book.author}</p>
                <p className="text-xs text-gray-500 mt-2">⭐ {book.rating || 0}</p>

                {/* Download Status */}
                <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                  {downloadedBooks.has(book.id) ? (
                    <>
                      <Check size={12} />
                      저장됨
                    </>
                  ) : (
                    <>
                      <Download size={12} />
                      다운로드
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-4">검색 결과 ({results.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleSelectBook(book)}
                  className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition text-left"
                >
                  <h3 className="font-bold mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{book.level}</span>
                    <span className="text-xs text-yellow-600">⭐ {book.rating || 0}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
