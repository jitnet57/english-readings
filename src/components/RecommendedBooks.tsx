import { useState } from 'react';
import { Star, TrendingUp, BookOpen, Zap } from 'lucide-react';
import { getBooksByCategory, getBooksByLevel, getPopularBooks, getBooksStatistics } from '@/data/booksDatabase';
import type { BookIndex } from '@/data/booksDatabase';

interface RecommendedBooksProps {
  onSelectBook: (book: BookIndex) => void;
}

export function RecommendedBooks({ onSelectBook }: RecommendedBooksProps) {
  const [activeTab, setActiveTab] = useState<'trending' | 'level' | 'category'>('trending');

  // 우리 데이터베이스에서 도서 로드
  const popularBooks = getPopularBooks(30); // 인기 도서 30권

  const categories: Record<string, BookIndex[]> = {
    literature: getBooksByCategory('literature'),
    mystery: getBooksByCategory('mystery'),
    fantasy: getBooksByCategory('fantasy'),
    romance: getBooksByCategory('romance'),
    adventure: getBooksByCategory('adventure'),
  };

  const byLevel = {
    beginner: getBooksByLevel('beginner'),
    intermediate: getBooksByLevel('intermediate'),
    advanced: getBooksByLevel('advanced'),
  };

  const stats = getBooksStatistics();

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition ${
            activeTab === 'trending'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <TrendingUp size={18} />
          인기 도서
        </button>
        <button
          onClick={() => setActiveTab('level')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition ${
            activeTab === 'level'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Zap size={18} />
          난이도별
        </button>
        <button
          onClick={() => setActiveTab('category')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition ${
            activeTab === 'category'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <BookOpen size={18} />
          카테고리
        </button>
      </div>

      {/* Trending Books */}
      {activeTab === 'trending' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="text-yellow-500" size={24} />
            <h3 className="text-2xl font-bold">지금 가장 인기 있는 도서</h3>
            <span className="text-sm text-gray-500">전체 {stats.total}권 중 인기순</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {popularBooks.map((book, idx) => (
              <button
                key={book.id}
                onClick={() => onSelectBook(book)}
                className="group bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
              >
                <div className="relative h-40 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                  <div className="text-5xl">#{idx + 1}</div>
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                    ⭐ {book.rating || 0}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm line-clamp-2 mb-1">{book.title}</h4>
                  <p className="text-xs text-gray-600">{book.author}</p>
                  <p className="text-xs text-gray-500 mt-2">📥 {(book.downloads || 0).toLocaleString()}+</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level-based Books */}
      {activeTab === 'level' && (
        <div className="space-y-6">
          {/* Beginner */}
          <div>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">🌱</span> 초급 - 처음 시작하는 분들을 위해
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {byLevel.beginner.map((book) => (
                <button
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-lg transition border-2 border-green-300"
                >
                  <h4 className="font-bold mb-1 line-clamp-2">{book.title}</h4>
                  <p className="text-sm text-gray-600">{book.author}</p>
                  <p className="text-xs text-green-700 mt-2">⭐ 쉬운 문장, 단순한 스토리</p>
                </button>
              ))}
            </div>
          </div>

          {/* Intermediate */}
          <div>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">🌻</span> 중급 - 기초를 다진 분들을 위해
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {byLevel.intermediate.map((book) => (
                <button
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg hover:shadow-lg transition border-2 border-yellow-300"
                >
                  <h4 className="font-bold mb-1 line-clamp-2">{book.title}</h4>
                  <p className="text-sm text-gray-600">{book.author}</p>
                  <p className="text-xs text-yellow-700 mt-2">⭐⭐ 고전 문학, 풍부한 표현</p>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced */}
          <div>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">🌹</span> 고급 - 깊이 있는 도서를 원하는 분들을 위해
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {byLevel.advanced.map((book) => (
                <button
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg hover:shadow-lg transition border-2 border-red-300"
                >
                  <h4 className="font-bold mb-1 line-clamp-2">{book.title}</h4>
                  <p className="text-sm text-gray-600">{book.author}</p>
                  <p className="text-xs text-red-700 mt-2">⭐⭐⭐ 복잡한 사건, 철학적 주제</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category-based Books */}
      {activeTab === 'category' && (
        <div className="space-y-6">
          {Object.entries(categories).map(([catKey, books]) => {
            const categoryIcons: Record<string, string> = {
              literature: '📖',
              mystery: '🔍',
              fantasy: '✨',
              romance: '💕',
              adventure: '🗺️',
              philosophy: '🧠',
              history: '📜',
              science: '🔬',
              poetry: '✍️',
              drama: '🎭',
            };
            const categoryNames: Record<string, string> = {
              literature: '문학',
              mystery: '미스터리',
              fantasy: '판타지',
              romance: '로맨스',
              adventure: '모험',
              philosophy: '철학',
              history: '역사',
              science: '과학',
              poetry: '시',
              drama: '연극',
            };

            return (
              <div key={catKey}>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span className="text-2xl">{categoryIcons[catKey] || '📚'}</span>
                  {categoryNames[catKey] || catKey} ({books.length}권)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {books && books.length > 0 ? (
                    books.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => onSelectBook(book)}
                        className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition border-l-4 border-blue-500"
                      >
                        <h4 className="font-bold mb-1 line-clamp-2">{book.title}</h4>
                        <p className="text-sm text-gray-600">{book.author}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{book.level}</span>
                          <span className="text-xs text-yellow-600">⭐ {book.rating || 0}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500">도서가 없습니다.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
