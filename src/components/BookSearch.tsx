import { useState } from 'react';
import { Search, Loader } from 'lucide-react';
import { searchBooks, searchByAuthor, getBooksByLevel } from '@/services/openLibraryService';
import { Book } from '@/types/book';

interface BookSearchProps {
  onSelectBook: (book: Book) => void;
  onBack: () => void;
}

export function BookSearch({ onSelectBook, onBack }: BookSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'title' | 'author'>('title');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearchPerformed(true);

    const books =
      searchType === 'title'
        ? await searchBooks(searchQuery)
        : await searchByAuthor(searchQuery);

    setResults(books);
    setLoading(false);
  };

  const handleLevelSearch = async (level: 'beginner' | 'intermediate' | 'advanced') => {
    setLoading(true);
    setSearchPerformed(true);
    const books = await getBooksByLevel(level);
    setResults(books);
    setLoading(false);
  };

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
            <h1 className="text-4xl font-bold">🔍 도서 검색</h1>
            <p className="text-sm opacity-90">Open Library의 백만개 도서에서 찾기</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="title"
                  checked={searchType === 'title'}
                  onChange={(e) => setSearchType(e.target.value as 'title')}
                />
                제목으로 검색
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="author"
                  checked={searchType === 'author'}
                  onChange={(e) => setSearchType(e.target.value as 'author')}
                />
                저자로 검색
              </label>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={
                    searchType === 'title'
                      ? '책 제목 입력... (예: Jane Eyre)'
                      : '저자 이름 입력... (예: Jane Austen)'
                  }
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

        {/* Level Search */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">난이도별 추천</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleLevelSearch('beginner')}
              disabled={loading}
              className="p-6 bg-green-100 border-2 border-green-500 rounded-lg hover:bg-green-200 disabled:opacity-50 transition"
            >
              <div className="text-2xl mb-2">🌱</div>
              <h3 className="font-bold text-lg">초급</h3>
              <p className="text-sm text-gray-600">쉬운 책들</p>
            </button>
            <button
              onClick={() => handleLevelSearch('intermediate')}
              disabled={loading}
              className="p-6 bg-yellow-100 border-2 border-yellow-500 rounded-lg hover:bg-yellow-200 disabled:opacity-50 transition"
            >
              <div className="text-2xl mb-2">🌻</div>
              <h3 className="font-bold text-lg">중급</h3>
              <p className="text-sm text-gray-600">고전 문학</p>
            </button>
            <button
              onClick={() => handleLevelSearch('advanced')}
              disabled={loading}
              className="p-6 bg-red-100 border-2 border-red-500 rounded-lg hover:bg-red-200 disabled:opacity-50 transition"
            >
              <div className="text-2xl mb-2">🌹</div>
              <h3 className="font-bold text-lg">고급</h3>
              <p className="text-sm text-gray-600">철학적 저작</p>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-blue-500" size={40} />
          </div>
        )}

        {/* Results */}
        {searchPerformed && !loading && (
          <>
            <h2 className="text-xl font-bold mb-4">
              검색 결과 ({results.length}개)
            </h2>

            {results.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 text-lg">검색 결과가 없습니다.</p>
                <p className="text-gray-500 text-sm mt-2">다른 검색어를 시도해보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => onSelectBook(book)}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden text-left group"
                  >
                    <div className="relative">
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-48 object-cover group-hover:opacity-90 transition"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1507842217343-583f20270319?w=200&h=300&fit=crop';
                        }}
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{book.author}</p>

                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            book.level === 'beginner'
                              ? 'bg-green-100 text-green-800'
                              : book.level === 'intermediate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {book.level === 'beginner'
                            ? '초급'
                            : book.level === 'intermediate'
                            ? '중급'
                            : '고급'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2">
                        {book.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
