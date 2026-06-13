import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader, BookOpen } from 'lucide-react';

interface BookDiscussionProps {
  bookTitle: string;
  bookAuthor: string;
  bookDescription: string;
  currentPageNumber: number;
  totalPages: number;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type AIModel = 'gemma2' | 'claude' | 'gpt' | 'llama' | 'custom';

export function BookDiscussion({
  bookTitle,
  bookAuthor,
  bookDescription,
  currentPageNumber,
  totalPages,
  onClose,
}: BookDiscussionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInitialAnalysis, setShowInitialAnalysis] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemma2');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiModels: Array<{ id: AIModel; name: string; description: string }> = [
    { id: 'gemma2', name: 'Gemma 2 (추천)', description: '빠르고 효율적' },
    { id: 'claude', name: 'Claude', description: '정교한 분석' },
    { id: 'gpt', name: 'GPT-4', description: '고급 기능' },
    { id: 'llama', name: 'Llama 2', description: '오픈소스' },
    { id: 'custom', name: '커스텀 모델', description: '사용자 정의' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 초기 분석 로드
  useEffect(() => {
    const loadInitialAnalysis = async () => {
      setLoading(true);
      try {
        // const analysisPrompt = createInitialAnalysisPrompt(bookTitle, bookAuthor, bookDescription);

        // 실제 배포 시: Claude API 호출
        // const response = await fetch('YOUR_BACKEND_API/analyze', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ prompt: analysisPrompt })
        // });
        // const data = await response.json();

        // 데모용: 샘플 분석
        const demoAnalysis = generateDemoAnalysis(bookTitle, bookAuthor);

        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: demoAnalysis,
            timestamp: new Date(),
          },
        ]);
        setShowInitialAnalysis(false);
      } catch (error) {
        console.error('Error loading initial analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialAnalysis();
  }, [bookTitle, bookAuthor, bookDescription]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // const analysisPrompt = createAnalysisPrompt({
      //   bookTitle,
      //   bookAuthor,
      //   currentPageContent,
      //   currentPageNumber,
      //   totalPages,
      //   userMessage: input,
      // });

      // 실제 배포 시: 선택한 모델로 API 호출
      // const response = await fetch('YOUR_BACKEND_API/analyze', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     prompt: analysisPrompt,
      //     model: selectedModel,
      //     bookTitle,
      //     bookAuthor
      //   })
      // });
      // const data = await response.json();

      // 데모용: 샘플 응답
      const demoResponse = generateDemoResponse(input, bookTitle);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: demoResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    '이 책의 핵심 메시지는 뭔가요?',
    '작가의 의도가 뭐라고 생각하세요?',
    '현실에 어떻게 적용할 수 있나요?',
    '주인공은 어떤 변화를 겪었나요?',
  ];

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-2xl flex flex-col z-40 border-l-4 border-yellow-400">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={20} />
            <div>
              <h2 className="font-bold text-sm line-clamp-1">{bookTitle}</h2>
              <p className="text-xs opacity-90">{bookAuthor}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Model Selector */}
        <div className="relative">
          <button
            onClick={() => setShowModelSelector(!showModelSelector)}
            className="w-full text-left text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition flex items-center justify-between"
          >
            <span>🤖 {aiModels.find(m => m.id === selectedModel)?.name}</span>
            <span className="text-xs">▼</span>
          </button>

          {showModelSelector && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white text-gray-800 rounded-lg shadow-lg z-50 border border-blue-200">
              {aiModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setShowModelSelector(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs border-b last:border-b-0 transition ${
                    selectedModel === model.id
                      ? 'bg-blue-100 font-bold'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold">{model.name}</div>
                  <div className="text-gray-500">{model.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-blue-50 px-4 py-2 text-xs text-gray-600">
        <div className="flex justify-between mb-1">
          <span>읽는 중</span>
          <span>{currentPageNumber}/{totalPages}</span>
        </div>
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${(currentPageNumber / totalPages) * 100}%` }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-lg p-3 text-sm ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {showInitialAnalysis && loading && (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader className="animate-spin" size={16} />
            <span className="text-sm">책 분석 중...</span>
          </div>
        )}

        {!showInitialAnalysis && messages.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 mb-3 font-medium">💡 추천 질문</p>
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="w-full text-left text-xs bg-yellow-50 hover:bg-yellow-100 text-gray-700 p-2 rounded border border-yellow-200 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4 space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="책에 대해 질문하세요..."
          className="w-full h-20 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 rounded-lg transition font-medium text-sm"
        >
          {loading ? (
            <>
              <Loader size={16} className="animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <Send size={16} />
              전송
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// 데모 분석 생성 함수
function generateDemoAnalysis(title: string, author: string): string {
  return `📖 **"${title}" (${author}) 종합 분석**

## 📚 기본 정보
- **출판 배경**: 이 작품은 문학사에서 중요한 위치를 차지하고 있으며, 당시 사회적 맥락을 반영합니다.
- **저자 소개**: ${author}는 자신의 경험과 관찰을 통해 이 작품을 창작했습니다.

## 💡 핵심 메시지
이 책의 주요 메시지는 인간의 본성, 사회적 관계, 그리고 개인의 성장에 관한 깊이 있는 탐구입니다.

## 🎯 배우고 적용할 수 있는 점
✓ 인간관계의 복잡성과 그 속에서의 성장
✓ 도덕적 선택의 중요성
✓ 변화와 적응의 필요성
✓ 자기 성찰의 가치

## 🔍 문학적 특징
- **문체**: 세밀한 심리 묘사와 아름다운 표현
- **구조**: 시간적 진행에 따른 자연스러운 전개
- **상징**: 풍부한 은유와 상징적 표현 사용

## 💬 이 책을 읽으면 좋은 이유
자신의 삶을 성찰하고, 다른 사람을 더 잘 이해할 수 있습니다. 문학을 통해 인생의 가치를 재발견할 수 있는 기회를 제공합니다.

---

**아래 질문들을 통해 더 깊이 있게 탐구해보세요!** 📝`;
}

// 데모 응답 생성 함수
function generateDemoResponse(question: string, bookTitle: string): string {
  const responses: Record<string, string> = {
    '이 책의 핵심 메시지는': `"${bookTitle}"의 핵심 메시지는 **개인의 성장과 자기 발견**에 있습니다.\n\n주인공이 겪는 여정을 통해 저자는 우리 모두가 인생 속에서 어떻게 변화하고 성장하는지를 보여줍니다. 특히 실패와 좌절이 얼마나 중요한 배움의 기회인지를 강조합니다.`,

    '작가의 의도가': `${bookTitle}를 통해 저자가 전하고자 한 핵심 의도는:\n\n1️⃣ **사회적 통념 거부** - 기존의 관습에 얽매이지 말 것\n2️⃣ **내면의 목소리 청취** - 자신의 진정한 감정 인정\n3️⃣ **공감과 이해** - 다양한 관점 수용\n\n이를 통해 독자들이 자신의 삶을 능동적으로 설계하기를 원합니다.`,

    '현실에 어떻게': `${bookTitle}의 교훈을 현실에 적용하는 방법:\n\n💼 **직업**: 자신의 진정한 소명을 찾고 그것을 추구하기\n👥 **인간관계**: 상대방의 입장에서 생각하고 공감하기\n🧠 **자기계발**: 실패를 성장의 기회로 보기\n❤️ **정신건강**: 자신을 있는 그대로 수용하기\n\n이러한 실천들이 모여 더 의미있는 인생을 만듭니다.`,

    '주인공은 어떤': `주인공의 변화 여정:\n\n**시작**: 약하고 불안정한 상태에서\n**경험**: 다양한 시련과 만남을 통해\n**성장**: 자신의 가치를 깨달으면서\n**결말**: 강하고 확신있는 사람으로 변모\n\n이 변화의 과정 자체가 책이 전하는 가장 중요한 메시지입니다.`,
  };

  for (const [key, value] of Object.entries(responses)) {
    if (question.includes(key)) {
      return value;
    }
  }

  return `"${bookTitle}"에 대한 흥미로운 질문입니다! 이 책은 다양한 관점에서 해석할 수 있는 풍부한 작품입니다.\n\n당신의 개인적 경험과 관점에서 이 책을 어떻게 이해하고 있는지 말씀해주시면, 더 깊이 있는 토론을 나눌 수 있을 것 같습니다. 📚`;
}
