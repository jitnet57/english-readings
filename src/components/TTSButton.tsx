import { useState, useEffect, useRef } from 'react';
import { Volume2, Pause, Settings } from 'lucide-react';

interface TTSButtonProps {
  text: string;
  onWordHighlight?: (wordIndex: number) => void;
  onHighlightedWords?: (indices: Set<number>) => void;
  onProgress?: (progress: number) => void;
}

export function TTSButton({ text, onWordHighlight, onHighlightedWords, onProgress }: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [rate, setRate] = useState(1.1); // 기본값: 1.1배속
  const [pitch, setPitch] = useState(1);
  const [syncOffset, setSyncOffset] = useState<number>(() => {
    // localStorage에서 싱크 오프셋 로드
    const saved = localStorage.getItem('tts-sync-offset');
    return saved ? parseInt(saved) : 0;
  });
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Samantha 음성 찾기 (macOS) 또는 기본 영어 음성
      let samanthaIndex = availableVoices.findIndex(v =>
        v.name.includes('Samantha') || v.name.includes('samantha')
      );

      if (samanthaIndex === -1) {
        // Samantha가 없으면 Google US English 찾기
        samanthaIndex = availableVoices.findIndex(v =>
          v.name.includes('Google US English') || v.name.includes('Google') && v.lang.includes('en-US')
        );
      }

      if (samanthaIndex === -1) {
        // 그래도 없으면 첫 번째 영어 음성
        samanthaIndex = availableVoices.findIndex(v => v.lang.startsWith('en'));
      }

      if (samanthaIndex !== -1) {
        setSelectedVoiceIndex(samanthaIndex);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // 싱크 오프셋 저장
  useEffect(() => {
    localStorage.setItem('tts-sync-offset', String(syncOffset));
  }, [syncOffset]);

  // 스페이스바 및 방향키 제어 기능
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // 스페이스바의 기본 동작 방지
        handleTTS();
      }
      // 방향키로 싱크 조절
      else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setSyncOffset(prev => Math.max(prev - 100, -500));
      }
      else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setSyncOffset(prev => Math.min(prev + 100, 500));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, voices, selectedVoiceIndex, rate, pitch, text]);

  const handleTTS = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      // 타임아웃 정리
      highlightTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      highlightTimeoutRef.current = [];
      if (onHighlightedWords) {
        onHighlightedWords(new Set());
      }
      return;
    }

    if (!text || voices.length === 0) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voices[selectedVoiceIndex];
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = pitch;

    // 토큰별 문자 시작 위치 맵 (charIndex → 토큰 인덱스 매핑용)
    const tokens = text.split(/(\s+)/);
    const tokenStart: number[] = [];
    let charPos = 0;
    tokens.forEach((tok) => {
      tokenStart.push(charPos);
      charPos += tok.length;
    });
    const totalWordTokens = tokens.filter((t) => t.trim()).length;

    const highlightedSet = new Set<number>();
    let boundaryFired = false;
    let readWordCount = 0;

    // charIndex가 속한 토큰 인덱스 찾기 (비공백 토큰)
    const tokenIndexForChar = (charIndex: number): number => {
      for (let i = 0; i < tokens.length; i++) {
        const start = tokenStart[i];
        const end = start + tokens[i].length;
        if (charIndex >= start && charIndex < end && tokens[i].trim()) {
          return i;
        }
      }
      return -1;
    };

    // ✅ 정확한 동기화: 실제 발화 중 단어 경계마다 발생 (charIndex 제공)
    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name && e.name !== 'word') return;
      boundaryFired = true;
      const idx = tokenIndexForChar(e.charIndex);
      if (idx === -1) return;

      const apply = () => {
        highlightedSet.add(idx);
        onWordHighlight?.(idx);
        onHighlightedWords?.(new Set(highlightedSet));
        readWordCount++;
        if (onProgress && totalWordTokens > 0) {
          onProgress(Math.min(99, Math.round((readWordCount / totalWordTokens) * 100)));
        }
      };

      // 싱크 오프셋: 양수면 늦게, 음수면 즉시 (미세 보정용)
      if (syncOffset > 0) {
        const t = setTimeout(apply, syncOffset);
        highlightTimeoutRef.current.push(t);
      } else {
        apply();
      }
    };

    utterance.onstart = () => {
      setIsPlaying(true);
      // 폴백: 600ms 내 boundary 이벤트가 없으면 추정 방식 사용 (일부 브라우저/음성 미지원)
      const fallbackTimer = setTimeout(() => {
        if (!boundaryFired) {
          setupEstimatedHighlighting(tokens, totalWordTokens, rate, syncOffset);
        }
      }, 600);
      highlightTimeoutRef.current.push(fallbackTimer);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      highlightTimeoutRef.current.forEach((t) => clearTimeout(t));
      highlightTimeoutRef.current = [];
      onProgress?.(100);
      onHighlightedWords?.(new Set());
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      highlightTimeoutRef.current.forEach((t) => clearTimeout(t));
      highlightTimeoutRef.current = [];
    };

    window.speechSynthesis.speak(utterance);
  };

  // 폴백: boundary 미지원 시 단어 길이 기반 추정 타이밍
  const setupEstimatedHighlighting = (
    tokens: string[],
    totalWordTokens: number,
    playbackRate: number,
    offset: number
  ) => {
    const highlightedSet = new Set<number>();
    const baseWordDuration = 450 / playbackRate;
    let accumulatedTime = 0;
    let readWordCount = 0;

    tokens.forEach((tok, idx) => {
      if (!tok.trim()) return;
      const len = tok.trim().length;
      const dur = baseWordDuration * (len > 8 ? 1.3 : len > 5 ? 1.15 : len > 3 ? 1.05 : 1.0);
      const timing = Math.max(0, accumulatedTime + offset);
      accumulatedTime += dur;

      const t = setTimeout(() => {
        highlightedSet.add(idx);
        onWordHighlight?.(idx);
        onHighlightedWords?.(new Set(highlightedSet));
        readWordCount++;
        if (onProgress && totalWordTokens > 0) {
          onProgress(Math.min(99, Math.round((readWordCount / totalWordTokens) * 100)));
        }
      }, timing);
      highlightTimeoutRef.current.push(t);
    });
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handleTTS}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition text-gray-900 ${
            isPlaying
              ? 'bg-yellow-300 hover:bg-yellow-400 shadow-lg'
              : 'bg-yellow-200 hover:bg-yellow-300'
          }`}
          title={`${isPlaying ? 'Stop playback' : 'Play audio'} (스페이스바 또는 터치로도 제어 가능)`}
        >
          {isPlaying ? <Pause size={20} /> : <Volume2 size={20} />}
          <div className="flex flex-col">
            <span className="text-base">{isPlaying ? '재생 중...' : '🔊 들으기'}</span>
            <span className="text-xs opacity-75 font-normal">스페이스바 또는 더블탭</span>
          </div>
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-gray-200 transition relative group"
          title="TTS settings"
        >
          <Settings size={18} />
          {/* 싱크 오프셋 빠른 조정 팝오버 */}
          <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-48 whitespace-nowrap">
            <p className="text-xs font-bold text-gray-700 mb-2">싱크 조정: {syncOffset}ms</p>
            <input
              type="range"
              min="-500"
              max="500"
              step="50"
              value={syncOffset}
              onChange={(e) => setSyncOffset(Number(e.target.value))}
              className="w-full"
              title="음수: 더 빨리, 양수: 더 천천히"
            />
            <p className="text-xs text-gray-500 mt-2">음수 = 빨리, 양수 = 천천히</p>
          </div>
        </button>
      </div>

      {showSettings && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-40 min-w-80">
          <h3 className="font-bold text-gray-800 mb-3">TTS 설정</h3>

          {/* Voice Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">음성 선택</label>
            <select
              value={selectedVoiceIndex}
              onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {voices.map((voice, idx) => (
                <option key={idx} value={idx}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speed Control */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              재생 속도: {rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5x</span>
              <span>2x</span>
            </div>
          </div>

          {/* Pitch Control */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              음성 높이: {pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>낮음</span>
              <span>높음</span>
            </div>
          </div>

          {/* Sync Offset Control */}
          <div className="mb-4 border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⏱️ 싱크 조정: {syncOffset}ms
            </label>
            <input
              type="range"
              min="-500"
              max="500"
              step="25"
              value={syncOffset}
              onChange={(e) => setSyncOffset(Number(e.target.value))}
              className="w-full"
            />
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mt-2">
              <button
                onClick={() => setSyncOffset(syncOffset - 100)}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition"
              >
                ← 100ms
              </button>
              <button
                onClick={() => setSyncOffset(0)}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition font-bold"
              >
                초기값
              </button>
              <button
                onClick={() => setSyncOffset(syncOffset + 100)}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition"
              >
                100ms →
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              음수 = 더 빨리 하이라이트, 양수 = 더 천천히 하이라이트
            </p>
          </div>

          <button
            onClick={() => setShowSettings(false)}
            className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
          >
            완료
          </button>
        </div>
      )}
    </div>
  );
}
