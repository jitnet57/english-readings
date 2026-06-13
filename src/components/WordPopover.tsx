import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { WordDefinition } from '@/data/dictionary';

interface WordPopoverProps {
  word: string;
  definition: WordDefinition | undefined;
  x: number;
  y: number;
  onClose: () => void;
}

export function WordPopover({ word, definition, x, y, onClose }: WordPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!definition) {
    return (
      <div
        ref={popoverRef}
        className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          transform: 'translate(-50%, -10px)',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{word}</h3>
            <p className="text-sm text-gray-500 mt-2">정의를 찾을 수 없습니다.</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={popoverRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -10px)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{definition.word}</h3>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{definition.pos}</p>
          {definition.ipa && (
            <p className="text-sm text-gray-600 mt-1">{definition.ipa}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>

      <div className="border-t border-gray-200 pt-3">
        {definition.definitions.map((def, idx) => (
          <div key={idx} className="mb-2">
            <p className="text-sm font-medium text-blue-600">[영문]</p>
            <p className="text-sm text-gray-700">{def.en}</p>
            <p className="text-sm font-medium text-green-600 mt-1">[한글]</p>
            <p className="text-sm text-gray-700">{def.ko}</p>
          </div>
        ))}
      </div>

      {definition.examples && definition.examples.length > 0 && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
            예문
          </p>
          {definition.examples.map((example, idx) => (
            <p key={idx} className="text-sm text-gray-600 italic mb-1">
              "{example}"
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
