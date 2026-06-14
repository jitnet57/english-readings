import { useState } from 'react';
import { BookReader } from '@/components/BookReader';
import { BookSearch } from '@/components/BookSearch';
import { GutenbergSearcher } from '@/components/GutenbergSearcher';
import { RecommendedBooks } from '@/components/RecommendedBooks';
import { Search, BookOpen } from 'lucide-react';
import { Book } from '@/types/book';
import { getLastRead, coverUrl } from '@/services/readingStore';

function App() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showGutenberg, setShowGutenberg] = useState(false);
  const [selectedBookIndex, setSelectedBookIndex] = useState<any>(null);
  const lastRead = getLastRead();

  if (selectedBook) {
    return <BookReader book={selectedBook} onBack={() => setSelectedBook(null)} />;
  }

  if (showGutenberg) {
    return (
      <GutenbergSearcher
        onBack={() => {
          setShowGutenberg(false);
          setSelectedBookIndex(null);
        }}
        selectedBook={selectedBookIndex}
      />
    );
  }

  if (showSearch) {
    return (
      <BookSearch
        onSelectBook={setSelectedBook}
        onBack={() => setShowSearch(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-bold mb-2">📚 SMEAG</h1>
            <p className="text-xl opacity-90">English Reading App with Korean Translation</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGutenberg(true)}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-blue-600 rounded-lg hover:bg-yellow-300 transition font-bold shadow-lg"
            >
              <BookOpen size={20} />
              전자도서관
            </button>
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-bold shadow-lg"
            >
              <Search size={20} />
              도서 검색
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 이어 읽기 (마지막 읽은 곳) */}
        {lastRead && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-3">📖 이어 읽기</h2>
            <button
              onClick={() => {
                setSelectedBookIndex({ id: lastRead.bookId, title: lastRead.title, author: lastRead.author });
                setShowGutenberg(true);
              }}
              className="w-full md:w-auto flex items-center gap-4 bg-white rounded-xl shadow-md hover:shadow-xl transition p-4 text-left border-l-4 border-amber-500"
            >
              <div className="w-16 h-24 rounded overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                <img
                  src={coverUrl(lastRead.bookId)}
                  alt={lastRead.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget;
                    t.style.display = 'none';
                    (t.nextElementSibling as HTMLElement).style.display = 'flex';
                  }}
                />
                <div className="text-3xl w-full h-full items-center justify-center" style={{ display: 'none' }}>📖</div>
              </div>
              <div>
                <h3 className="font-bold text-lg">{lastRead.title}</h3>
                <p className="text-sm text-gray-600">{lastRead.author}</p>
                <p className="text-sm text-amber-700 mt-2 font-medium">
                  {lastRead.page + 1} / {lastRead.totalPages} 페이지부터 이어 읽기 →
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-3">🔊</div>
            <h3 className="font-bold text-lg mb-2">Text-to-Speech</h3>
            <p className="text-gray-600 text-sm">
              음성으로 영문을 들으며 발음을 배우세요. 음성, 속도, 높이 조절 가능
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-3">📖</div>
            <h3 className="font-bold text-lg mb-2">병렬 번역</h3>
            <p className="text-gray-600 text-sm">
              영문과 한글을 나란히 보며 자연스러운 문맥으로 학습하세요
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-bold text-lg mb-2">단어 학습</h3>
            <p className="text-gray-600 text-sm">
              단어를 드래그하면 정의와 예문이 즉시 나타납니다
            </p>
          </div>
        </div>

        {/* Books Section - Recommended Books */}
        <div>
          <div className="mb-4">
            <h2 className="text-3xl font-bold mb-2">📚 추천 도서</h2>
            <p className="text-gray-600 mb-8">당신의 수준과 관심사에 맞는 도서를 찾아보세요</p>
          </div>
          <RecommendedBooks
            onSelectBook={(book) => {
              setSelectedBookIndex(book);
              setShowGutenberg(true);
            }}
          />
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-600 text-sm">
          <p>모든 도서는 Project Gutenberg에서 수집한 저작권 만료 저작입니다.</p>
          <p>무료로 학습하세요! 🌍</p>
        </div>
      </div>
    </div>
  );
}

export default App;
