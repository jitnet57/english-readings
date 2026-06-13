/**
 * 페이지별 순차 번역 서비스
 * 첫 페이지부터 순차적으로 번역하고, 각 페이지마다 저장합니다.
 */

import { saveTranslatedPage } from './downloadService';
import { translateText, type TargetLanguage } from './translationService';

export interface TranslationProgress {
  currentPage: number;
  totalPages: number;
  completedPages: number;
  isTranslating: boolean;
  error?: string;
}

export class PageTranslationService {
  private abortController: AbortController | null = null;
  private translationPromise: Promise<void> | null = null;

  /**
   * 책의 모든 페이지를 순차적으로 번역
   * 첫 페이지부터 시작하며, 각 페이지 번역 후 콜백 실행
   */
  async translatePagesSequentially(
    bookId: number,
    pages: string[],
    targetLanguage: TargetLanguage,
    onProgress?: (progress: TranslationProgress) => void,
    onPageTranslated?: (pageIndex: number, translatedContent: string) => void
  ): Promise<string[]> {
    this.abortController = new AbortController();
    const translatedPages: string[] = Array(pages.length).fill('');
    let completedPages = 0;

    try {
      for (let i = 0; i < pages.length; i++) {
        // 중단 확인
        if (this.abortController.signal.aborted) {
          break;
        }

        // 진행 상태 업데이트
        onProgress?.({
          currentPage: i,
          totalPages: pages.length,
          completedPages,
          isTranslating: true,
        });

        try {
          // 페이지 번역
          const translated = await translateText(pages[i], targetLanguage, 'mymemory');
          translatedPages[i] = translated;
          completedPages++;

          // 번역된 페이지 저장 (IndexedDB) - 오류 무시
          try {
            await saveTranslatedPage(bookId, targetLanguage, i, translated, pages.length);
          } catch (dbError) {
            console.warn('Could not save translation to IndexedDB, continuing offline:', dbError);
          }

          // 페이지 번역 완료 콜백
          onPageTranslated?.(i, translated);

          // API 레이트 제한 회피를 위한 딜레이
          if (i < pages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          console.error(`Error translating page ${i}:`, error);
          onProgress?.({
            currentPage: i,
            totalPages: pages.length,
            completedPages,
            isTranslating: false,
            error: `페이지 ${i + 1} 번역 실패`,
          });

          // 오류가 발생해도 계속 진행
          translatedPages[i] = pages[i]; // 원문 사용
        }
      }

      // 완료
      onProgress?.({
        currentPage: pages.length - 1,
        totalPages: pages.length,
        completedPages,
        isTranslating: false,
      });

      return translatedPages;
    } catch (error) {
      console.error('Error in page translation service:', error);
      throw error;
    }
  }

  /**
   * 번역 중단
   */
  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * 번역 완료 대기
   */
  async waitForCompletion(): Promise<void> {
    if (this.translationPromise) {
      await this.translationPromise;
    }
  }
}

// 싱글톤 인스턴스
export const pageTranslationService = new PageTranslationService();
