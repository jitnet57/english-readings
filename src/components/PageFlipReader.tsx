import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Globe, StickyNote, Trash2, X } from 'lucide-react';
import { TTSButton, type TTSHandle } from './TTSButton';
import { BookDiscussion } from './BookDiscussion';
import { getVocabularyInfo, levelColors, examColors, getLevelLabel } from '@/data/vocabularyData';
import { SUPPORTED_LANGUAGES, translateText, type TargetLanguage } from '@/services/translationService';
import {
  saveProgress, getProgress, saveLastRead,
  addMemo, deleteMemo, getMemosForBook, type Memo,
} from '@/services/readingStore';

interface PageFlipReaderProps {
  bookId: number;
  title: string;
  author: string;
  pages: string[];
  onBack: () => void;
}

// 페이지를 문장 단위로 분리하되, 각 문장의 전역 토큰 시작 인덱스를 유지
// (TTS 하이라이트가 전체 페이지 토큰 인덱스를 사용하므로 정합성 보장)
interface SentenceGroup {
  tokens: string[];
  startIndex: number; // split(/(\s+)/) 배열에서 첫 토큰의 전역 인덱스
  text: string;
}

function splitPageIntoSentences(pageText: string): SentenceGroup[] {
  const tokens = pageText.split(/(\s+)/);
  const groups: SentenceGroup[] = [];
  let current: string[] = [];
  let start = 0;

  tokens.forEach((tok, idx) => {
    if (current.length === 0) start = idx;
    current.push(tok);
    const trimmed = tok.trim();
    // 문장 끝 부호(.!?)로 끝나는 토큰에서 한 문장 마무리
    if (trimmed.length > 0 && /[.!?]["'’”)\]]?$/.test(trimmed)) {
      groups.push({ tokens: current, startIndex: start, text: current.join('').trim() });
      current = [];
    }
  });
  if (current.length > 0) {
    groups.push({ tokens: current, startIndex: start, text: current.join('').trim() });
  }
  return groups;
}

export function PageFlipReader({ bookId, title, author, pages, onBack }: PageFlipReaderProps) {
  // 이어 읽기: 저장된 진행 위치에서 시작 (범위 보정)
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = getProgress(bookId);
    return saved < pages.length ? saved : 0;
  });
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [touches, setTouches] = useState({ startY: 0, endY: 0 });
  const [highlightedWords, setHighlightedWords] = useState<Set<number>>(new Set());
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [hoveredWord, setHoveredWord] = useState<{ word: string; x: number; y: number } | null>(null);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('ko');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [translationOn, setTranslationOn] = useState(false);
  // pageIndex → 문장별 번역 배열 (문장 인덱스에 정렬)
  const [sentenceTranslations, setSentenceTranslations] = useState<Map<number, string[]>>(new Map());
  const currentWordRef = useRef<HTMLSpanElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const ttsRef = useRef<TTSHandle>(null);
  const suppressTapRef = useRef(false);
  const pendingAutoPlayRef = useRef(false);
  const [isReading, setIsReading] = useState(false);
  const [everStarted, setEverStarted] = useState(false);

  // TTS가 한 페이지를 다 읽으면 → 다음 페이지로 넘어가 계속 읽기
  const handleTtsFinish = () => {
    if (currentPage < pages.length - 1) {
      pendingAutoPlayRef.current = true;
      setCurrentPage((p) => p + 1);
    }
  };

  // 페이지가 바뀐 뒤 자동 재생 예약이 있으면 새 페이지를 이어서 읽기
  useEffect(() => {
    if (pendingAutoPlayRef.current) {
      pendingAutoPlayRef.current = false;
      const t = setTimeout(() => ttsRef.current?.play(), 400);
      return () => clearTimeout(t);
    }
  }, [currentPage]);

  // 읽는 동안 화면이 꺼지지 않도록 Wake Lock 유지 (백그라운드 낭독 유지)
  useEffect(() => {
    let lock: any = null;
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator && isReading) {
          lock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        /* 미지원/거부 시 무시 */
      }
    };
    if (isReading) acquire();
    // 탭이 다시 보이면 재획득 (wake lock은 탭 숨김 시 해제됨)
    const onVis = () => {
      if (document.visibilityState === 'visible' && isReading) acquire();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (lock) {
        lock.release().catch(() => {});
        lock = null;
      }
    };
  }, [isReading]);
  // 메모 클립
  const [memos, setMemos] = useState<Memo[]>(() => getMemosForBook(bookId));
  const [showMemos, setShowMemos] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState<{ text: string; x: number; y: number } | null>(null);
  const [selectionTranslation, setSelectionTranslation] = useState<string>('');

  // 진행 위치 + 이어읽기 정보 저장 (페이지 이동 시)
  useEffect(() => {
    saveProgress(bookId, currentPage);
    saveLastRead({
      bookId, title, author,
      page: currentPage, totalPages: pages.length, savedAt: Date.now(),
    });
  }, [bookId, currentPage, title, author, pages.length]);

  // 드래그 선택 → 메모 추가 버튼 + 해석 표시
  const handleTextSelection = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || '';
    if (text.length > 0 && sel && sel.rangeCount > 0) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setSelectionInfo({ text, x: rect.left + rect.width / 2, y: rect.bottom });
      // 선택한 문장 해석 (비동기)
      setSelectionTranslation('');
      translateText(text, targetLanguage, 'mymemory')
        .then((t) => setSelectionTranslation(t))
        .catch(() => setSelectionTranslation(''));
    } else {
      setSelectionInfo(null);
      setSelectionTranslation('');
    }
  };

  const handleAddMemo = () => {
    if (!selectionInfo) return;
    const note = window.prompt(`메모 (선택: "${selectionInfo.text.slice(0, 40)}...")`, '') ?? '';
    addMemo({
      bookId, bookTitle: title, page: currentPage,
      text: selectionInfo.text, note,
    });
    setMemos(getMemosForBook(bookId));
    setSelectionInfo(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleDeleteMemo = (id: string) => {
    deleteMemo(id);
    setMemos(getMemosForBook(bookId));
  };

  // 화면 터치/클릭으로 재생·정지 토글 (스와이프·텍스트선택 중엔 무시)
  const handleScreenTap = () => {
    if (suppressTapRef.current) {
      suppressTapRef.current = false;
      return;
    }
    // 드래그로 텍스트를 선택 중이면 토글하지 않음 (메모용 선택 보호)
    const sel = window.getSelection()?.toString().trim() || '';
    if (sel.length > 0) return;
    ttsRef.current?.toggle();
  };

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

  // 한 페이지를 문장 단위로 번역 (각 문장이 완료될 때마다 점진적으로 표시)
  const translatePageSentences = async (pageIndex: number) => {
    const groups = splitPageIntoSentences(pages[pageIndex]);
    const result: string[] = new Array(groups.length).fill('');
    for (let i = 0; i < groups.length; i++) {
      try {
        result[i] = await translateText(groups[i].text, targetLanguage, 'mymemory');
      } catch {
        result[i] = '';
      }
      // 문장 하나 끝날 때마다 화면 갱신
      setSentenceTranslations(prev => {
        const next = new Map(prev);
        next.set(pageIndex, [...result]);
        return next;
      });
    }
  };

  // 번역 켜기: 현재 페이지를 문장별로 즉시 번역 → 이후 페이지는 백그라운드
  const handleTranslate = async () => {
    setTranslationOn(true);
    if (sentenceTranslations.has(currentPage)) return;
    setIsTranslating(true);
    await translatePageSentences(currentPage);
    setIsTranslating(false);

    // 나머지 페이지 백그라운드 번역
    (async () => {
      for (let p = 0; p < pages.length; p++) {
        if (p === currentPage) continue;
        if (!sentenceTranslations.has(p)) {
          await translatePageSentences(p);
        }
      }
    })();
  };

  // 번역 모드에서 페이지 이동 시, 캐시 없으면 해당 페이지 문장 번역
  useEffect(() => {
    if (translationOn && !sentenceTranslations.has(currentPage)) {
      setIsTranslating(true);
      translatePageSentences(currentPage).finally(() => setIsTranslating(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, translationOn]);

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

    // 아래로 스와이프 (다음 페이지) — 스와이프 후 탭 토글 방지
    if (diff > 50) {
      suppressTapRef.current = true;
      handleNextPage();
    }
    // 위로 스와이프 (이전 페이지)
    else if (diff < -50) {
      suppressTapRef.current = true;
      handlePrevPage();
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
          <button
            onClick={() => setShowMemos(!showMemos)}
            className="text-2xl hover:opacity-80 transition ml-4 relative"
            title="메모 클립"
          >
            📎
            {memos.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {memos.length}
              </span>
            )}
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
                      setSentenceTranslations(new Map()); // 언어 변경 시 번역 초기화
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

      {/* 상단 컨트롤 (들으기 + 번역 + 이전/다음 + 진행도, 항상 노출/고정) */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          {/* 진행 바 */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* 이전 · 들으기 · 다음 */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="flex items-center gap-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronUp size={18} />
              <span className="text-sm font-medium hidden sm:inline">이전</span>
            </button>

            <TTSButton
              ref={ttsRef}
              text={pages[currentPage]}
              onWordHighlight={(idx) => setCurrentWordIndex(idx)}
              onHighlightedWords={(indices) => setHighlightedWords(indices)}
              onProgress={(p) => setTtsProgress(p)}
              onFinish={handleTtsFinish}
              onPlayingChange={(playing) => {
                setIsReading(playing);
                if (playing) setEverStarted(true);
              }}
            />

            <button
              onClick={handleNextPage}
              disabled={currentPage === pages.length - 1}
              className="flex items-center gap-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span className="text-sm font-medium hidden sm:inline">다음</span>
              <ChevronDown size={18} />
            </button>
          </div>
          {/* 문장별 번역 토글 + 페이지 정보 */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {!translationOn ? (
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition"
              >
                {isTranslating ? '번역 중...' : `📖 ${SUPPORTED_LANGUAGES[targetLanguage]} 문장별 번역`}
              </button>
            ) : (
              <button
                onClick={() => setTranslationOn(false)}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition"
              >
                번역 숨기기
              </button>
            )}
            <span className="text-xs text-gray-500">
              {currentPage + 1} / {pages.length} pages
            </span>
          </div>
        </div>
      </div>

      {/* 중지 시 화면 중앙에 반투명 재생 표시 (순수 시각 표시 — 호버/클릭 통과) */}
      {everStarted && !isReading && (
        <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
          <span className="w-24 h-24 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white text-5xl shadow-2xl">
            ▶
          </span>
        </div>
      )}

      {/* Main Content - Book Page (단일 페이지 스크롤) */}
      <div
        className="flex-1 flex items-start justify-center p-4 md:p-8 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Book Open Effect */}
        <div className="relative w-full max-w-2xl">
          {/* Left Page Shadow */}
          <div className="absolute -left-2 top-0 w-1 h-full bg-gradient-to-r from-black/20 to-transparent rounded-l-lg" />

          {/* Page Content */}
          <div className="bg-yellow-50 shadow-2xl rounded-r-lg p-8 md:p-12 min-h-96 flex flex-col book-page">
            {/* Page Text with Highlighting — 본문 터치/클릭으로 재생·정지 (단일 스크롤) */}
            <div
              ref={textContainerRef}
              onClick={handleScreenTap}
              onMouseUp={handleTextSelection}
              onTouchEnd={handleTextSelection}
              className="flex-1 relative pr-1 cursor-pointer select-text"
            >
              {/* 문장마다: 원문(형광색+펜슬) 첫째 줄, 번역 둘째 줄 */}
              {(() => {
                // 읽은 위치까지 연속 형광색을 위한 최대 읽은 토큰 인덱스
                const maxReadIdx = highlightedWords.size > 0
                  ? Math.max(...Array.from(highlightedWords), currentWordIndex)
                  : currentWordIndex;

                const groups = splitPageIntoSentences(pages[currentPage]);
                const pageTranslations = sentenceTranslations.get(currentPage);

                // 한 토큰(단어/공백)을 렌더링 (전역 인덱스 사용)
                const renderToken = (word: string, idx: number) => {
                  const isSpace = /^\s+$/.test(word);
                  const cleanWord = word.replace(/[^\w']/g, '').toLowerCase();
                  const vocabInfo = isSpace ? undefined : getVocabularyInfo(cleanWord);
                  const isImportant = !!vocabInfo;
                  const isCurrent = currentWordIndex === idx;
                  const isRead = maxReadIdx >= 0 && idx <= maxReadIdx;

                  let bg = '';
                  if (isCurrent) bg = 'bg-yellow-300';
                  else if (isRead) bg = 'bg-yellow-200';
                  else if (isImportant) bg = 'bg-purple-100';

                  const underline = isImportant
                    ? 'underline decoration-wavy decoration-purple-500 decoration-2 text-purple-800'
                    : '';
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
                      {isCurrent && (
                        // 🔺 빨간 삼각형 포인터 — 문장(단어)을 위로 가리킴
                        <span
                          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 pointer-events-none animate-bounce"
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderBottom: '9px solid #ef4444',
                          }}
                        />
                      )}
                      {word}
                    </span>
                  );
                };

                return groups.map((group, gi) => {
                  const translation = pageTranslations?.[gi];
                  return (
                    <div key={group.startIndex} className="mb-4">
                      {/* 1번째 줄: 원문 */}
                      <p className="text-base md:text-lg leading-loose text-gray-800 text-justify whitespace-pre-wrap">
                        {group.tokens.map((tok, j) => renderToken(tok, group.startIndex + j))}
                      </p>
                      {/* 2번째 줄: 번역 */}
                      {translationOn && (
                        <p className="text-sm md:text-base leading-relaxed text-blue-700 pl-3 border-l-2 border-blue-300 mt-1">
                          {translation
                            ? translation
                            : <span className="text-gray-400 italic">번역 중...</span>}
                        </p>
                      )}
                    </div>
                  );
                });
              })()}

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

      {/* 드래그 선택 → 해석 + 메모 저장 플로팅 카드 */}
      {selectionInfo && (
        <div
          className="fixed z-50 -translate-x-1/2 bg-white border border-amber-300 rounded-lg shadow-2xl p-3 max-w-xs"
          style={{ left: `${selectionInfo.x}px`, top: `${selectionInfo.y + 8}px` }}
        >
          {/* 해석 */}
          <div className="mb-2">
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              {SUPPORTED_LANGUAGES[targetLanguage]} 해석
            </span>
            <p className="text-sm text-gray-800 mt-1">
              {selectionTranslation
                ? selectionTranslation
                : <span className="text-gray-400 italic">해석 중...</span>}
            </p>
          </div>
          <button
            onClick={handleAddMemo}
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded text-sm font-bold hover:bg-amber-600 transition"
          >
            <StickyNote size={15} /> 메모 저장
          </button>
        </div>
      )}

      {/* 메모 클립 패널 */}
      {showMemos && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl flex flex-col">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">📎 메모 클립 ({memos.length})</h3>
            <button onClick={() => setShowMemos(false)} className="hover:opacity-80">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {memos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center mt-8">
                본문에서 중요한 곳을 드래그하면<br />메모를 저장할 수 있어요.
              </p>
            ) : (
              memos.map((memo) => (
                <div key={memo.id} className="border border-amber-200 rounded-lg p-3 bg-amber-50">
                  <div className="flex justify-between items-start gap-2">
                    <button
                      onClick={() => { setCurrentPage(memo.page); setShowMemos(false); }}
                      className="text-xs font-bold text-amber-700 hover:underline"
                    >
                      📖 {memo.page + 1}페이지로 이동
                    </button>
                    <button onClick={() => handleDeleteMemo(memo.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-800 mt-2 italic">"{memo.text}"</p>
                  {memo.note && <p className="text-xs text-blue-700 mt-2 border-t pt-2">📝 {memo.note}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
