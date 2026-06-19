import { useState } from 'react';
import { Upload, Loader, FileText } from 'lucide-react';
import { importFile, splitTextIntoPages } from '@/services/fileImportService';
import { translateDocument } from '@/services/translationService';
import { PageFlipReader } from './PageFlipReader';

interface FileImporterProps {
  onBack: () => void;
}

// 파일명 → 안정적 양수 id (이어읽기/메모 키용)
function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return 900000000 + (Math.abs(h) % 90000000);
}

// 읽을 언어(번역 대상) 옵션
const READ_LANGS: { code: string; label: string }[] = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'ko', label: '🇰🇷 한국어' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'zh-CN', label: '🇨🇳 中文' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'fr', label: '🇫🇷 Français' },
];

export function FileImporter({ onBack }: FileImporterProps) {
  const [stage, setStage] = useState<'idle' | 'parsing' | 'translating' | 'ready'>('idle');
  const [title, setTitle] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [bookId, setBookId] = useState(0);
  const [readLang, setReadLang] = useState('en');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sourceText, setSourceText] = useState('');

  // 1단계: 파일 파싱
  const handleFile = async (file: File) => {
    setError('');
    setStage('parsing');
    try {
      const { title: t, text } = await importFile(file);
      if (!text || text.trim().length < 5) {
        throw new Error('파일에서 텍스트를 추출하지 못했습니다.');
      }
      setTitle(t);
      setSourceText(text);
      setPendingFile(file);
      setBookId(hashId(file.name));
      setStage('idle'); // 언어 선택 단계로
    } catch (e: any) {
      setError(e?.message || '파일을 읽지 못했습니다.');
      setStage('idle');
      setPendingFile(null);
    }
  };

  // 2단계: 선택 언어로 번역 후 읽기
  const startReading = async () => {
    const srcPages = splitTextIntoPages(sourceText, 280);
    setStage('translating');
    setProgress({ done: 0, total: srcPages.length });
    const translated: string[] = [];
    for (let i = 0; i < srcPages.length; i++) {
      const t = await translateDocument(srcPages[i], readLang, 'auto');
      translated.push(t);
      setProgress({ done: i + 1, total: srcPages.length });
    }
    setPages(translated);
    setStage('ready');
  };

  if (stage === 'ready' && pages.length > 0) {
    return (
      <PageFlipReader
        bookId={bookId}
        title={title}
        author="내 파일"
        pages={pages}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="text-2xl hover:opacity-80">←</button>
          <div>
            <h1 className="text-3xl font-bold">📂 내 파일 읽기</h1>
            <p className="text-sm opacity-90">txt · md · pdf 파일을 번역해서 읽어요</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* 파싱 중 */}
        {stage === 'parsing' && (
          <div className="text-center py-16">
            <Loader className="animate-spin text-emerald-500 mx-auto mb-4" size={40} />
            <p className="text-gray-700">파일을 읽는 중...</p>
          </div>
        )}

        {/* 번역 중 */}
        {stage === 'translating' && (
          <div className="text-center py-16">
            <Loader className="animate-spin text-emerald-500 mx-auto mb-4" size={40} />
            <h2 className="text-xl font-bold text-gray-800 mb-2">번역 중입니다...</h2>
            <p className="text-gray-600 mb-4">{title}</p>
            <div className="w-72 mx-auto">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">{progress.done} / {progress.total} 페이지</p>
            </div>
          </div>
        )}

        {/* 업로드 / 언어 선택 */}
        {stage === 'idle' && (
          <>
            {!pendingFile ? (
              <label className="block border-2 border-dashed border-emerald-300 rounded-xl p-12 text-center cursor-pointer hover:bg-emerald-50 transition">
                <Upload className="text-emerald-500 mx-auto mb-3" size={40} />
                <p className="font-bold text-gray-800 mb-1">파일을 선택하세요</p>
                <p className="text-sm text-gray-500">txt, md, pdf 지원 (hwp는 PDF로 변환 후)</p>
                <input
                  type="file"
                  accept=".txt,.md,.markdown,.pdf,.hwp,.hwpx"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </label>
            ) : (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="text-emerald-600" size={28} />
                  <div>
                    <p className="font-bold text-gray-800">{title}</p>
                    <p className="text-xs text-gray-500">{sourceText.length.toLocaleString()}자</p>
                  </div>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">읽을 언어 (번역 대상)</label>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {READ_LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setReadLang(l.code)}
                      className={`px-3 py-2 rounded-lg text-sm border-2 transition ${
                        readLang === l.code
                          ? 'border-emerald-500 bg-emerald-50 font-bold'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={startReading}
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition"
                  >
                    번역해서 읽기 시작
                  </button>
                  <button
                    onClick={() => { setPendingFile(null); setSourceText(''); }}
                    className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                  >
                    다른 파일
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  💡 영어로 읽으면 TTS 발음·단어 호버 해석이 가장 잘 동작합니다.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
