/**
 * IELTS, TOEIC, TOEFL 단어 및 난위도 데이터
 */

export type ExamType = 'IELTS' | 'TOEIC' | 'TOEFL' | 'GENERAL';
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface VocabularyInfo {
  word: string;
  meaning: string;
  level: Level;
  exams: ExamType[];
  definition: string;
  example?: string;
  isIdiom?: boolean;
}

// CEFR 레벨 색상 매핑
export const levelColors: Record<Level, string> = {
  A1: 'bg-green-100 text-green-800',      // 초급
  A2: 'bg-green-200 text-green-900',      // 초급-중급
  B1: 'bg-yellow-100 text-yellow-800',    // 중급
  B2: 'bg-orange-100 text-orange-800',    // 중급-고급
  C1: 'bg-red-100 text-red-800',          // 고급
  C2: 'bg-purple-100 text-purple-800',    // 최고급
};

// 시험별 색상
export const examColors: Record<ExamType, string> = {
  IELTS: 'bg-blue-100 text-blue-700',
  TOEIC: 'bg-indigo-100 text-indigo-700',
  TOEFL: 'bg-cyan-100 text-cyan-700',
  GENERAL: 'bg-gray-100 text-gray-700',
};

// 중요 단어 및 숙어 데이터
export const importantVocabulary: Record<string, VocabularyInfo> = {
  vulnerable: {
    word: 'vulnerable',
    meaning: '취약한, 상처받기 쉬운',
    level: 'B2',
    exams: ['IELTS', 'TOEFL'],
    definition: 'capable of being hurt or harmed',
    example: 'She was vulnerable to criticism.',
  },
  ceaselessly: {
    word: 'ceaselessly',
    meaning: '끊임없이, 계속해서',
    level: 'C1',
    exams: ['IELTS', 'TOEFL'],
    definition: 'without stopping; continuously',
    example: 'The waves crashed ceaselessly against the shore.',
  },
  resilience: {
    word: 'resilience',
    meaning: '회복력, 탄력',
    level: 'B2',
    exams: ['IELTS', 'TOEIC', 'TOEFL'],
    definition: 'the ability to recover quickly',
    example: 'Human resilience is remarkable.',
  },
  'in my younger years': {
    word: 'in my younger years',
    meaning: '내가 젊었을 때',
    level: 'A2',
    exams: ['GENERAL'],
    definition: 'during one\'s youth',
    isIdiom: true,
  },
  'beat on': {
    word: 'beat on',
    meaning: '계속 전진하다, 노력하다',
    level: 'B1',
    exams: ['IELTS', 'TOEFL'],
    definition: 'to continue struggling despite difficulties',
    isIdiom: true,
  },
  'borne back': {
    word: 'borne back',
    meaning: '뒤로 밀려나다',
    level: 'C1',
    exams: ['IELTS', 'TOEFL'],
    definition: 'carried or pushed backward',
    isIdiom: true,
  },
  'in want of': {
    word: 'in want of',
    meaning: '필요로 하다',
    level: 'B2',
    exams: ['IELTS', 'TOEFL'],
    definition: 'in need of',
    isIdiom: true,
  },
  'turn over in mind': {
    word: 'turn over in mind',
    meaning: '곰곰이 생각하다',
    level: 'B1',
    exams: ['IELTS'],
    definition: 'to think about carefully',
    isIdiom: true,
  },
  advantage: {
    word: 'advantage',
    meaning: '이점, 장점',
    level: 'A2',
    exams: ['TOEIC', 'GENERAL'],
    definition: 'a beneficial factor or combination of factors',
  },
  character: {
    word: 'character',
    meaning: '성격, 특성',
    level: 'A2',
    exams: ['GENERAL'],
    definition: 'the mental and moral qualities of a person',
  },
  quality: {
    word: 'quality',
    meaning: '품질, 질',
    level: 'A2',
    exams: ['TOEIC', 'GENERAL'],
    definition: 'the degree of excellence',
  },
  prejudice: {
    word: 'prejudice',
    meaning: '편견',
    level: 'B2',
    exams: ['IELTS', 'TOEFL'],
    definition: 'preconceived opinion not based on reason',
  },
  acknowledge: {
    word: 'acknowledge',
    meaning: '인정하다',
    level: 'B1',
    exams: ['IELTS', 'TOEIC'],
    definition: 'to admit or recognize',
  },
  'set one\'s mind': {
    word: 'set one\'s mind',
    meaning: '마음먹다, 결심하다',
    level: 'B2',
    exams: ['IELTS'],
    definition: 'to decide or determine',
    isIdiom: true,
  },
  allure: {
    word: 'allure',
    meaning: '매력, 매혹',
    level: 'B2',
    exams: ['IELTS', 'TOEFL'],
    definition: 'the power to attract',
  },
  eloquence: {
    word: 'eloquence',
    meaning: '웅변, 유창함',
    level: 'C1',
    exams: ['IELTS', 'TOEFL'],
    definition: 'the power of fluent, persuasive speech',
  },
};

// 단어 검색 함수
export function getVocabularyInfo(word: string): VocabularyInfo | undefined {
  const lowercaseWord = word.toLowerCase();
  return importantVocabulary[lowercaseWord];
}

// 난위도 표시 함수
export function getLevelLabel(level: Level): string {
  const labels: Record<Level, string> = {
    A1: 'A1 (초급)',
    A2: 'A2 (초급-중급)',
    B1: 'B1 (중급)',
    B2: 'B2 (중급-고급)',
    C1: 'C1 (고급)',
    C2: 'C2 (최고급)',
  };
  return labels[level];
}
