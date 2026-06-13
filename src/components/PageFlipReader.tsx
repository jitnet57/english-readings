import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Globe } from 'lucide-react';
import { TTSButton } from './TTSButton';
import { BookDiscussion } from './BookDiscussion';
import { getVocabularyInfo, levelColors, examColors, getLevelLabel } from '@/data/vocabularyData';
import { SUPPORTED_LANGUAGES, type TargetLanguage } from '@/services/translationService';
import { pageTranslationService, type TranslationProgress } from '@/services/pageTranslationService';
import { getTranslatedBook } from '@/services/downloadService';

interface PageFlipReaderProps {
  title: string;
  author: string;
  pages: string[];
  onBack: () => void;
}

export function PageFlipReader({ title, author, pages, onBack }: PageFlipReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [touches, setTouches] = useState({ startY: 0, endY: 0 });
  const [highlightedWords, setHighlightedWords] = useState<Set<number>>(new Set());
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [hoveredWord, setHoveredWord] = useState<{ word: string; x: number; y: number } | null>(null);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('ko');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [translatedPages, setTranslatedPages] = useState<Map<number, string>>(new Map());
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress | null>(null);
  const currentWordRef = useRef<HTMLSpanElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);

  // 자동 스크롤: 읽는 단어(빨간 펜슬 위치)로 화면을 부드럽게 이동
  useEffect(() => {
    if (currentWordIndex >= 0 && currentWordRef.current) {
      currentWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentWordIndex]);

  // 자동 페이지 넘기기 (TTS 완료 후)
  useEffect(() => {
    if (isAutoPlay && currentPage < pages.length - 1) {
      const timer = setTimeout(() => {
        setCurrentPage(prev => prev + 1);
      }, 5000); // 5초마다 다음 페이지

      return () => clearTimeout(timer);
    } else if (currentPage >= pages.length - 1) {
      setIsAutoPlay(false);
    }
  }, [isAutoPlay, currentPage, pages.length]);

  // 페이지 변경 시 번역 상태 업데이트
  useEffect(() => {
    if (translatedPages.has(currentPage)) {
      setTranslatedContent(translatedPages.get(currentPage) || null);
    } else {
      setTranslatedContent(null);
    }
  }, [currentPage, translatedPages]);

  // 번역 요청 (페이지별 순차 번역)
  const handleTranslate = async () => {
    setIsTranslating(true);

    try {
      // 캐시된 번역 확인
      const cached = await getTranslatedBook(1, targetLanguage);
      if (cached && cached.pages[currentPage]) {
        setTranslatedContent(cached.pages[currentPage]);
        setTranslatedPages(new Map(cached.pages.entries()));
        setIsTranslating(false);
        return;
      }

      // 페이지별 순차 번역 시작
      const translatedPagesList: string[] = [];

      await pageTranslationService.translatePagesSequentially(
        1, // bookId (더미)
        pages,
        targetLanguage,
        (progress) => {
          setTranslationProgress(progress);
        },
        (pageIndex, translatedContent) => {
          translatedPagesList[pageIndex] = translatedContent;
          const newMap = new Map(translatedPages);
          newMap.set(pageIndex, translatedContent);
          setTranslatedPages(newMap);

          // 첫 페이지 번역 완료 시 바로 표시
          if (pageIndex === 0) {
            setTranslatedContent(translatedContent);
          }
        }
      );
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouches({ ...touches, startY: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const diff = touches.startY - endY;

    // 아래로 스와이프 (다음 페이지)
    if (diff > 50) {
      handleNextPage();
    }
    // 위로 스와이프 (이전 페이지)
    else if (diff < -50) {
      handlePrevPage();
    }
    // 아래를 터치 (TTS 토글)
    else if (Math.abs(diff) < 10 && endY > window.innerHeight * 0.7) {
      // TTS 토글: 하단부 터치
      console.log('Bottom tap detected - TTS toggle');
    }
  };

  const progress = ((currentPage + 1) / pages.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-orange-700 text-white py-4 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-2xl hover:opacity-80 transition"
          >
            ←
          </button>
          <div className="flex-1 text-center mx-4">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm opacity-90">by {author}</p>
          </div>
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="text-2xl hover:opacity-80 transition"
            title={isAutoPlay ? 'Stop auto-play' : 'Start auto-play'}
          >
            {isAutoPlay ? '⏸' : '▶'}
          </button>
          <button
            onClick={() => setShowDiscussion(!showDiscussion)}
            className="text-2xl hover:opacity-80 transition ml-4"
            title="Discuss this book with AI"
          >
            💬
          </button>

          {/* Language Selector */}
          <div className="relative ml-4">
            <button
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className="flex items-center gap-1 text-sm hover:opacity-80 transition"
              title="Translate to another language"
            >
              <Globe size={18} />
              🌐
            </button>

            {showLanguageSelector && (
              <div className="absolute top-full right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl z-50 min-w-48 border border-orange-200">
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => {
                      setTargetLanguage(code as TargetLanguage);
                      setShowLanguageSelector(false);
                      setTranslatedContent(null); // 언어 변경 시 번역 초기화
                    }}
                    className={`w-full text-left px-4 py-2 text-sm border-b last:border-b-0 transition ${
                      targetLanguage === code
                        ? 'bg-blue-100 font-bold'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TTS Progress Indicator */}
      {ttsProgress > 0 && ttsProgress < 100 && (
        <div className="h-1 bg-gray-200 w-full">
          <div
            className="h-full bg-red-500 transition-all duration-100"
            style={{ width: `${ttsProgress}%` }}
          />
        </div>
      )}

      {/* Main Content - Book Page */}
      <div
        className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden cursor-pointer select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Book Open Effect */}
        <div className="relative w-full max-w-2xl">
          {/* Left Page Shadow */}
          <div className="absolute -left-2 top-0 w-1 h-full bg-gradient-to-r from-black/20 to-transparent rounded-l-lg" />

          {/* Page Content */}
          <div className="bg-yellow-50 shadow-2xl rounded-r-lg p-8 md:p-12 min-h-96 flex flex-col justify-center book-page">
            {/* Translation Controls */}
            <div className="mb-4 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition"
                  >
                    {isTranslating ? '번역 중...' : `${SUPPORTED_LANGUAGES[targetLanguage]}로 번역`}
                  </button>
                  {translatedContent && (
                    <button
                      onClick={() => setTranslatedContent(null)}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                    >
                      번역 숨기기
                    </button>
                  )}
                  {!translatedContent && translatedPages.has(currentPage) && (
                    <button
                      onClick={() => setTranslatedContent(translatedPages.get(currentPage) || null)}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition"
                    >
                      번역 보기
                    </button>
                  )}
                </div>

                {/* 번역 진행률 */}
                {isTranslating && translationProgress && (
                  <div className="bg-blue-50 p-2 rounded text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>번역 진행률</span>
                      <span>{translationProgress.completedPages}/{translationProgress.totalPages} 페이지</span>
                    </div>
                    <div className="w-full h-2 bg-blue-200 rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{
                          width: `${(translationProgress.completedPages / translationProgress.totalPages) * 100}%`
                        }}
                      />
                    </div>
                    {translationProgress.error && (
                      <p className="text-red-600">{translationProgress.error}</p>
                    )}
                  </div>
                )}
              </div>

            {/* Page Text with Highlighting */}
            <div ref={textContainerRef} className="flex-1 relative max-h-[55vh] overflow-y-auto pr-2">
              {/* 원문 (항상 표시) — 읽은 부분 연속 형광색 + 중요 단어 강조 + 빨간 펜슬 */}
              <p className="text-base md:text-lg leading-loose text-gray-800 text-justify whitespace-pre-wrap">
                {(() => {
                  // 읽은 위치까지 연속 형광색을 만들기 위해 최대 읽은 토큰 인덱스 계산
                  const maxReadIdx = highlightedWords.size > 0
                    ? Math.max(...Array.from(highlightedWords), currentWordIndex)
                    : currentWordIndex;

                  return pages[currentPage].split(/(\s+)/).map((word, idx) => {
                    const isSpace = /^\s+$/.test(word);
                    const cleanWord = word.replace(/[^\w']/g, '').toLowerCase();
                    const vocabInfo = isSpace ? undefined : getVocabularyInfo(cleanWord);
                    const isImportant = !!vocabInfo;
                    const isCurrent = currentWordIndex === idx;
                    // 연속 형광: 읽은 위치 이하의 모든 토큰(공백 포함)에 배경 적용
                    const isRead = maxReadIdx >= 0 && idx <= maxReadIdx;

                    // 배경색: 현재 단어는 진한 노랑, 읽은 부분은 연한 노랑(연속)
                    let bg = '';
                    if (isCurrent) bg = 'bg-yellow-300';
                    else if (isRead) bg = 'bg-yellow-200';
                    else if (isImportant) bg = 'bg-yellow-100';

                    // 중요 단어는 항상 물결 밑줄 (읽었든 안 읽었든)
                    const underline = isImportant
                      ? 'underline decoration-wavy decoration-yellow-500 decoration-2'
                      : '';
                    // 현재 읽는 단어는 빨간 펜슬 밑줄
                    const pencilUnderline = isCurrent ? 'border-b-2 border-red-500' : '';

                    return (
                      <span
                        key={idx}
                        ref={isCurrent ? currentWordRef : undefined}
                        className={`relative transition-colors duration-200 ${bg} ${underline} ${pencilUnderline} ${isImportant ? 'cursor-help font-medium' : ''} ${isCurrent ? 'font-bold' : ''}`}
                        title={isImportant ? `📖 ${vocabInfo?.meaning}` : ''}
                        onMouseEnter={(e) => {
                          if (vocabInfo) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredWord({ word: cleanWord, x: rect.left, y: rect.top });
                          }
                        }}
                        onMouseLeave={() => setHoveredWord(null)}
                      >
                        {/* 🖍️ 빨간 펜슬 — 현재 읽는 단어 위에서 같이 이동 */}
                        {isCurrent && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm pointer-events-none animate-bounce">
                            ✏️
                          </span>
                        )}
                        {word}
                      </span>
                    );
                  });
                })()}
              </p>

              {/* 번역문 — 원문 바로 아래 표시 */}
              {translatedContent && (
                <div className="mt-4 pt-4 border-t-2 border-dashed border-amber-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {SUPPORTED_LANGUAGES[targetLanguage]} 번역
                    </span>
                  </div>
                  <p className="text-base md:text-lg leading-8 text-gray-600 text-justify whitespace-pre-wrap">
                    {translatedContent}
                  </p>
                </div>
              )}

              {/* Tooltip */}
              {hoveredWord && getVocabularyInfo(hoveredWord.word) && (
                <div
                  className="fixed bg-white border-2 border-yellow-400 rounded-lg shadow-xl p-4 z-50 max-w-xs"
                  style={{
                    left: `${hoveredWord.x}px`,
                    top: `${hoveredWord.y - 10}px`,
                    transform: 'translateY(-100%)',
                  }}
                >
                  {(() => {
                    const info = getVocabularyInfo(hoveredWord.word);
                    if (!info) return null;

                    return (
                      <div className="space-y-2">
                        <h4 className="font-bold text-lg text-gray-800">{info.word}</h4>

                        {/* Level Badge */}
                        <div className={`inline-block px-2 py-1 rounded text-xs font-bold ${levelColors[info.level]}`}>
                          {getLevelLabel(info.level)}
                        </div>

                        {/* Exam Badges */}
                        <div className="flex flex-wrap gap-1">
                          {info.exams.map((exam) => (
                            <span key={exam} className={`inline-block px-2 py-1 rounded text-xs font-bold ${examColors[exam]}`}>
                              {exam}
                            </span>
                          ))}
                        </div>

                        {/* Meaning */}
                        <p className="text-sm font-medium text-blue-600">{info.meaning}</p>

                        {/* Definition */}
                        <p className="text-sm text-gray-700">{info.definition}</p>

                        {/* Example */}
                        {info.example && (
                          <p className="text-xs text-gray-600 italic border-l-2 border-yellow-400 pl-2">
                            "{info.example}"
                          </p>
                        )}

                        {/* Idiom Badge */}
                        {info.isIdiom && (
                          <p className="text-xs text-orange-600 font-bold">📖 관용구</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Page Number */}
            <div className="mt-8 text-right text-sm text-gray-500">
              Page {currentPage + 1} / {pages.length}
            </div>
          </div>

          {/* Right Page Fold */}
          <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-white/30 to-transparent rounded-r-lg pointer-events-none" />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-t border-gray-200 p-4 md:p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">
              {currentPage + 1} / {pages.length} pages
            </p>
          </div>

          {/* TTS Button */}
          <div className="flex justify-center mb-4">
            <TTSButton
              text={pages[currentPage]}
              onWordHighlight={(idx) => setCurrentWordIndex(idx)}
              onHighlightedWords={(indices) => setHighlightedWords(indices)}
              onProgress={(progress) => setTtsProgress(progress)}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronUp size={20} />
              <span className="text-sm font-medium">이전</span>
            </button>

            <div className="text-center text-sm text-gray-600">
              {isAutoPlay && (
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  🔊 자동 재생 중
                </span>
              )}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === pages.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span className="text-sm font-medium">다음</span>
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Hints */}
          <div className="space-y-2 text-xs text-gray-500 text-center mt-4">
            <p>💡 위/아래로 스와이프하거나 버튼을 클릭해 페이지를 넘기세요</p>
            <p>⏱️ 스페이스바로 TTS 재생/중지 (설정 &gt; ⏱️싱크 조정으로 타이밍 조절)</p>
          </div>
        </div>
      </div>

      {/* AI Discussion Panel */}
      {showDiscussion && (
        <BookDiscussion
          bookTitle={title}
          bookAuthor={author}
          bookDescription={`${title} by ${author} - A literary work from Project Gutenberg`}
          currentPageNumber={currentPage + 1}
          totalPages={pages.length}
          onClose={() => setShowDiscussion(false)}
        />
      )}

      {/* CSS */}
      <style>{`
        .book-page {
          animation: pageFlip 0.5s ease-out;
          perspective: 1000px;
        }

        @keyframes pageFlip {
          0% {
            transform: rotateY(20deg);
            opacity: 0.8;
          }
          100% {
            transform: rotateY(0deg);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .book-page {
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
}
