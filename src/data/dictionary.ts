export interface WordDefinition {
  word: string;
  pos: string;
  definitions: {
    en: string;
    ko: string;
  }[];
  ipa?: string;
  examples?: string[];
}

export const dictionary: Record<string, WordDefinition> = {
  the: {
    word: 'the',
    pos: 'article',
    definitions: [
      {
        en: 'used before a noun to refer to a person or thing that is already known',
        ko: '이미 알려진 사람이나 것을 지칭하기 위해 명사 앞에 사용',
      },
    ],
  },
  vulnerable: {
    word: 'vulnerable',
    pos: 'adjective',
    definitions: [
      {
        en: 'exposed to the possibility of being attacked or harmed, either physically or emotionally',
        ko: '신체적으로든 감정적으로든 공격이나 피해를 받을 수 있는 상태에 노출됨',
      },
    ],
    ipa: '/ˈvʌl.nə.rə.bəl/',
  },
  years: {
    word: 'years',
    pos: 'noun',
    definitions: [
      {
        en: 'plural of year; a period of 365 or 366 days',
        ko: '연도의 복수형; 365 또는 366일의 기간',
      },
    ],
  },
  father: {
    word: 'father',
    pos: 'noun',
    definitions: [
      {
        en: 'a male parent',
        ko: '남성 부모',
      },
    ],
    ipa: '/ˈfɑː.ðɚ/',
  },
  advice: {
    word: 'advice',
    pos: 'noun',
    definitions: [
      {
        en: 'guidance or recommendations offered with regard to prudent future action',
        ko: '현명한 미래 행동에 관해 제시된 지도 또는 권고',
      },
    ],
    ipa: '/əd\'vaɪs/',
  },
  criticizing: {
    word: 'criticizing',
    pos: 'verb',
    definitions: [
      {
        en: 'expressing disapproval of someone or something',
        ko: '누군가 또는 무언가에 대한 불만을 표현함',
      },
    ],
  },
  advantages: {
    word: 'advantages',
    pos: 'noun',
    definitions: [
      {
        en: 'conditions or circumstances that put one in a favorable or superior position',
        ko: '유리하거나 우월한 위치에 놓이게 하는 조건이나 상황',
      },
    ],
  },
  ceaselessly: {
    word: 'ceaselessly',
    pos: 'adverb',
    definitions: [
      {
        en: 'without stopping; continuously',
        ko: '멈추지 않고; 계속해서',
      },
    ],
    ipa: '/ˈsiːs.ləs.li/',
    examples: [
      'The waves crashed ceaselessly against the shore.',
      'She worked ceaselessly to achieve her dreams.',
    ],
  },
  boats: {
    word: 'boats',
    pos: 'noun',
    definitions: [
      {
        en: 'small vessels designed to transport people or goods on water',
        ko: '물 위에서 사람이나 물품을 운송하도록 설계된 작은 선박',
      },
    ],
  },
  current: {
    word: 'current',
    pos: 'noun',
    definitions: [
      {
        en: 'the flow of water or air in a particular direction',
        ko: '특정 방향으로 흐르는 물이나 공기의 흐름',
      },
    ],
    ipa: '/ˈkɝ.ənt/',
  },
  past: {
    word: 'past',
    pos: 'noun',
    definitions: [
      {
        en: 'the time or a period of time that has already happened',
        ko: '이미 일어난 시간 또는 기간',
      },
    ],
  },
  quality: {
    word: 'quality',
    pos: 'noun',
    definitions: [
      {
        en: 'the degree of excellence of something',
        ko: '무언가의 우수성의 정도',
      },
    ],
  },
  character: {
    word: 'character',
    pos: 'noun',
    definitions: [
      {
        en: 'the mental and moral qualities distinctive to an individual',
        ko: '개인에게 특별한 정신적, 도덕적 특성',
      },
    ],
  },
};

export function getWordDefinition(word: string): WordDefinition | undefined {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
  return dictionary[normalized];
}
