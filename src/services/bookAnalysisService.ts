/**
 * 책 분석 및 AI 토론 서비스
 * Claude API를 통해 책에 대한 분석과 토론을 제공합니다.
 */

export interface BookAnalysisRequest {
  bookTitle: string;
  bookAuthor: string;
  currentPageContent: string;
  currentPageNumber: number;
  totalPages: number;
  userMessage: string;
  readingHistory?: string[];
}

export interface BookAnalysis {
  keyLearnings: string[];
  applications: string[];
  authorIntent: string;
  perspective: string;
  themes: string[];
  characterAnalysis: string;
  literaryDevices: string[];
}

// 책 분석 프롬프트 생성
export function createAnalysisPrompt(request: BookAnalysisRequest): string {
  return `당신은 뛰어난 문학 비평가이자 독서 지도 교사입니다.

현재 읽는 책:
- 제목: ${request.bookTitle}
- 저자: ${request.bookAuthor}
- 진행률: ${request.currentPageNumber}/${request.totalPages} (${Math.round((request.currentPageNumber / request.totalPages) * 100)}%)

현재 페이지 내용:
${request.currentPageContent.substring(0, 500)}...

사용자의 질문/의견:
${request.userMessage}

이 질문에 대해 다음을 고려하여 답변해주세요:
1. **배운점**: 이 책에서 배울 수 있는 핵심 내용
2. **응용**: 현실에서 어떻게 적용할 수 있는가
3. **활용**: 실무나 일상에서의 활용 방법
4. **작가의 의도**: 저자가 이 책을 통해 전하고자 한 메시지
5. **시점**: 저자의 관점, 문화적 배경, 시대적 맥락
6. **테마**: 책의 주요 주제들
7. **문학적 기법**: 사용된 문체, 구조, 표현 기법

깊이 있으면서도 이해하기 쉬운 답변을 제공해주세요.`;
}

// 책 분석 API 호출 (실제 구현은 백엔드에서 처리)
export async function analyzeBook(request: BookAnalysisRequest): Promise<string> {
  try {
    // 실제 배포 시: 백엔드 API 호출
    // const response = await fetch('/api/book-analysis', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(request)
    // });
    // return response.json();

    // 데모용: 프롬프트 생성만 반환
    return createAnalysisPrompt(request);
  } catch (error) {
    console.error('Error analyzing book:', error);
    throw error;
  }
}

// 책 전체 분석 (처음 읽을 때)
export function createInitialAnalysisPrompt(
  bookTitle: string,
  bookAuthor: string,
  bookDescription: string
): string {
  return `"${bookTitle}" (${bookAuthor})에 대한 종합 분석

책 설명: ${bookDescription}

이 책에 대해 다음을 분석해주세요:

## 📚 기본 정보
- 출판 배경과 역사적 맥락
- 저자의 삶과 창작 동기

## 💡 핵심 내용
- 주요 메시지와 테마
- 중심 아이디어

## 🎯 배우고 적용할 수 있는 점
- 이 책을 통해 배울 수 있는 것들
- 일상에서 바로 적용할 수 있는 조언

## 🔍 문학적 분석
- 문체와 구조
- 특징적인 표현 기법

## 💬 이 책을 읽으면 좋은 이유

명확하고 구체적인 예시를 들어 설명해주세요.`;
}

// 챕터별 분석
export function createChapterAnalysisPrompt(
  bookTitle: string,
  chapterNumber: number,
  chapterContent: string,
  previousContext?: string
): string {
  return `"${bookTitle}" - ${chapterNumber}장 분석

현재 챕터 내용:
${chapterContent.substring(0, 800)}...

${previousContext ? `이전 맥락: ${previousContext}` : ''}

이 챕터에서:
1. **주요 사건/발전**: 무엇이 일어났나?
2. **캐릭터 성장**: 등장인물들이 어떻게 변했나?
3. **테마 연결**: 전체 책의 주제와 어떻게 연결되나?
4. **의미**: 왜 이 부분이 중요한가?
5. **예상**: 다음에 무엇이 일어날까?

간결하면서도 통찰력 있는 분석을 제공해주세요.`;
}
