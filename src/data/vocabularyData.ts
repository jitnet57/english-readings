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

  // === 고전 문학에 자주 등장하는 시험 단어 (대폭 확장) ===
  fortune: { word: 'fortune', meaning: '재산, 운', level: 'B1', exams: ['IELTS', 'TOEIC'], definition: 'a large amount of money or luck' },
  acquaintance: { word: 'acquaintance', meaning: '지인, 아는 사이', level: 'B2', exams: ['IELTS', 'TOEFL'], definition: 'a person one knows slightly' },
  affection: { word: 'affection', meaning: '애정, 호감', level: 'B2', exams: ['IELTS', 'TOEFL'], definition: 'a gentle feeling of fondness' },
  sentiment: { word: 'sentiment', meaning: '정서, 감정', level: 'B2', exams: ['IELTS', 'TOEFL'], definition: 'a view or feeling about something' },
  countenance: { word: 'countenance', meaning: '얼굴 표정', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: "a person's face or facial expression" },
  endeavour: { word: 'endeavour', meaning: '노력, 시도', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'an attempt to achieve a goal' },
  endeavor: { word: 'endeavor', meaning: '노력, 시도', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'an attempt to achieve a goal' },
  circumstance: { word: 'circumstance', meaning: '상황, 환경', level: 'B2', exams: ['IELTS', 'TOEIC', 'TOEFL'], definition: 'a fact or condition connected with an event' },
  consequence: { word: 'consequence', meaning: '결과, 중요성', level: 'B2', exams: ['IELTS', 'TOEIC', 'TOEFL'], definition: 'a result or effect of an action' },
  considerable: { word: 'considerable', meaning: '상당한', level: 'B2', exams: ['IELTS', 'TOEIC', 'TOEFL'], definition: 'notably large in amount or extent' },
  obliged: { word: 'obliged', meaning: '고마운, ~할 의무가 있는', level: 'B2', exams: ['IELTS', 'TOEIC'], definition: 'grateful or legally bound to do something' },
  amiable: { word: 'amiable', meaning: '상냥한, 친절한', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'having a friendly and pleasant manner' },
  prudent: { word: 'prudent', meaning: '신중한', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'acting with care and thought for the future' },
  earnest: { word: 'earnest', meaning: '진지한, 성실한', level: 'B2', exams: ['IELTS', 'TOEFL'], definition: 'serious and sincere' },
  esteem: { word: 'esteem', meaning: '존경, 존중', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'respect and admiration' },
  diligence: { word: 'diligence', meaning: '근면, 성실', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'careful and persistent effort' },
  solitude: { word: 'solitude', meaning: '고독, 외로움', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'the state of being alone' },
  melancholy: { word: 'melancholy', meaning: '우울, 침울', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'a feeling of deep sadness' },
  tranquil: { word: 'tranquil', meaning: '고요한, 평온한', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'calm and peaceful' },
  abundant: { word: 'abundant', meaning: '풍부한', level: 'B2', exams: ['IELTS', 'TOEFL'], definition: 'existing in large quantities' },
  diminish: { word: 'diminish', meaning: '줄어들다, 감소하다', level: 'B2', exams: ['IELTS', 'TOEIC', 'TOEFL'], definition: 'to make or become less' },
  perceive: { word: 'perceive', meaning: '인지하다, 감지하다', level: 'B2', exams: ['IELTS', 'TOEFL'], definition: 'to become aware of through the senses' },
  profound: { word: 'profound', meaning: '깊은, 심오한', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'very great or intense; showing deep insight' },
  reluctant: { word: 'reluctant', meaning: '꺼리는, 마지못한', level: 'B2', exams: ['IELTS', 'TOEIC', 'TOEFL'], definition: 'unwilling and hesitant' },
  remarkable: { word: 'remarkable', meaning: '주목할 만한', level: 'B2', exams: ['IELTS', 'TOEIC', 'TOEFL'], definition: 'worthy of attention; striking' },
  sincere: { word: 'sincere', meaning: '진실한, 진심의', level: 'B1', exams: ['IELTS', 'TOEIC', 'TOEFL'], definition: 'free from pretense; genuine' },
  virtue: { word: 'virtue', meaning: '미덕, 선', level: 'B2', exams: ['IELTS', 'TOEFL'], definition: 'behavior showing high moral standards' },
  wretched: { word: 'wretched', meaning: '비참한, 불행한', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'in a very unhappy or unfortunate state' },
  ardent: { word: 'ardent', meaning: '열렬한, 열정적인', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'very enthusiastic or passionate' },
  benevolent: { word: 'benevolent', meaning: '자비로운, 인자한', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'well meaning and kindly' },
  conceal: { word: 'conceal', meaning: '숨기다, 감추다', level: 'B2', exams: ['IELTS', 'TOEIC', 'TOEFL'], definition: 'to keep from being seen or known' },
  despair: { word: 'despair', meaning: '절망', level: 'B2', exams: ['IELTS', 'TOEFL'], definition: 'the complete loss of hope' },
  ample: { word: 'ample', meaning: '충분한, 넉넉한', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'enough or more than enough' },
  scarcely: { word: 'scarcely', meaning: '거의 ~않다', level: 'B2', exams: ['IELTS', 'TOEFL'], definition: 'hardly; only just' },
  hitherto: { word: 'hitherto', meaning: '지금까지', level: 'C2', exams: ['IELTS', 'TOEFL'], definition: 'until now or until the point in time under discussion' },
  endure: { word: 'endure', meaning: '견디다, 참다', level: 'B2', exams: ['IELTS', 'TOEIC', 'TOEFL'], definition: 'to suffer patiently; to last' },
  obstinate: { word: 'obstinate', meaning: '완고한, 고집스러운', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'stubbornly refusing to change' },
  candid: { word: 'candid', meaning: '솔직한', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'truthful and straightforward' },
  feeble: { word: 'feeble', meaning: '약한, 미약한', level: 'C1', exams: ['IELTS', 'TOEFL'], definition: 'lacking physical or mental strength' },
  marriage: { word: 'marriage', meaning: '결혼', level: 'A2', exams: ['TOEIC', 'GENERAL'], definition: 'the legal union of two people' },
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
