import { useState } from 'react';
import { ArrowLeft, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';

function CodeBlock({ code, language = '' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-900">
      {language && (
        <div className="border-b border-gray-700 bg-gray-800 px-4 py-1.5 text-xs text-gray-400">{language}</div>
      )}
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md bg-gray-700 p-1.5 text-gray-300 opacity-0 transition hover:bg-gray-600 group-hover:opacity-100"
        title="복사"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({ step, title, children, defaultOpen = false }: {
  step: number; title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-gray-50"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          {step}
        </span>
        <span className="flex-1 text-base font-semibold text-gray-900">{title}</span>
        {open ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
      </button>
      {open && (
        <div className="border-t border-gray-100 px-6 py-5 text-sm leading-relaxed text-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

export default function SaasGuideChat() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <button
        onClick={() => navigate('/saas/chat')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} />
        채팅 AI SaaS로 돌아가기
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Party-Up 채팅 AI 연동 가이드</h1>
        <p className="mt-2 text-sm text-gray-500">
          Ollama LLM 기반 한국어 욕설·비매너 실시간 탐지 API를 파트너 서비스에 연동하는 방법입니다.
        </p>
      </div>

      {/* 연동 흐름 */}
      <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-5">
        <h3 className="mb-3 text-sm font-semibold text-emerald-800">연동 흐름 개요</h3>
        <div className="flex flex-col items-center gap-2 text-xs text-emerald-700 sm:flex-row sm:gap-0">
          <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-center font-medium">
            ① 파트너 서버<br /><span className="text-emerald-500">채팅 메시지 수신</span>
          </div>
          <span className="hidden text-emerald-400 sm:block">→</span>
          <span className="text-emerald-400 sm:hidden">↓</span>
          <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-center font-medium">
            ② Party-Up API<br /><span className="text-emerald-500">3단계 파이프라인 분석</span>
          </div>
          <span className="hidden text-emerald-400 sm:block">→</span>
          <span className="text-emerald-400 sm:hidden">↓</span>
          <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-center font-medium">
            ③ 결과 반환<br /><span className="text-emerald-500">none / offensive / hate</span>
          </div>
        </div>
      </div>

      {/* 탐지 라벨 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">탐지 라벨 체계</h3>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">라벨</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">등급</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">설명</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">권장 처리</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-2 font-mono font-medium text-green-600">none</td>
                <td className="px-3 py-2 text-gray-600">정상</td>
                <td className="px-3 py-2 text-gray-600">일반적인 대화</td>
                <td className="px-3 py-2 text-gray-600">전송 허용</td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2 font-mono font-medium text-amber-600">offensive</td>
                <td className="px-3 py-2 text-gray-600">경고</td>
                <td className="px-3 py-2 text-gray-600">타인을 향한 욕설, 비방</td>
                <td className="px-3 py-2 text-gray-600">경고 메시지 표시 또는 순화</td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2 font-mono font-medium text-red-600">hate</td>
                <td className="px-3 py-2 text-gray-600">즉시 차단</td>
                <td className="px-3 py-2 text-gray-600">혐오 발언, 심한 욕설</td>
                <td className="px-3 py-2 text-gray-600">전송 차단</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 사전 준비 */}
      <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 p-5">
        <h3 className="mb-2 text-sm font-semibold text-amber-800">사전 준비</h3>
        <ul className="space-y-1 text-sm text-amber-700">
          <li>• 채팅 AI SaaS 페이지에서 API 키를 발급받으세요.</li>
          <li>• <strong>Secret Key</strong>만 사용합니다. (서버 간 API 호출)</li>
          <li>• 프론트엔드에서 직접 호출하지 마세요. Secret Key가 노출됩니다.</li>
          <li>• 채팅 메시지 전송 전 서버에서 검증 후 전달하는 구조를 권장합니다.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <Section step={1} title="API 호출 방법" defaultOpen={true}>
          <p className="mb-3">
            채팅 메시지를 파트너 서버에서 받아 Party-Up 탐지 API로 전달합니다.
            응답의 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">label</code> 필드로 처리 방식을 결정하세요.
          </p>
          <h4 className="mb-2 text-sm font-semibold text-gray-800">요청</h4>
          <CodeBlock
            language="HTTP"
            code={`POST https://api.party-up.store/api/chat-filter/analyze
Content-Type: application/json
Authorization: Bearer sk_live_여기에_Secret_Key

{
  "text": "분석할 채팅 메시지",
  "user_id": "사용자_식별자 (선택)",
  "context": ["이전 메시지1", "이전 메시지2"]  // 선택, 문맥 분석용
}`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">응답</h4>
          <CodeBlock
            language="JSON"
            code={`{
  "label": "offensive",
  "score": 0.960,
  "pipeline": {
    "stage1_blacklist": "pass",
    "stage2_ml": "offensive",
    "stage3_llm": null
  },
  "processed_by": "stage2",
  "response_ms": 24
}`}
          />
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600">응답 필드 설명</p>
            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
              <li>• <code>label</code>: 최종 판정 (none / offensive / hate)</li>
              <li>• <code>score</code>: 신뢰도 (0.0 ~ 1.0)</li>
              <li>• <code>pipeline.stage1_blacklist</code>: 키워드 필터 결과</li>
              <li>• <code>pipeline.stage2_ml</code>: KR-ELECTRA 분류 결과</li>
              <li>• <code>pipeline.stage3_llm</code>: Ollama LLM 재판단 결과 (경계 케이스만)</li>
              <li>• <code>processed_by</code>: 최종 판정을 내린 단계</li>
            </ul>
          </div>
        </Section>

        <Section step={2} title="서버 구현 예시 (Node.js)">
          <CodeBlock
            language="JavaScript (Node.js)"
            code={`const PARTYUP_SECRET = process.env.PARTYUP_CHAT_SECRET_KEY;

async function analyzeChat(text, userId) {
  const resp = await fetch(
    'https://api.party-up.store/api/chat-filter/analyze',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${PARTYUP_SECRET}\`,
      },
      body: JSON.stringify({ text, user_id: userId }),
    }
  );
  return resp.json();
}

// 채팅 전송 핸들러
app.post('/chat/send', async (req, res) => {
  const { message, userId } = req.body;

  const result = await analyzeChat(message, userId);

  if (result.label === 'hate') {
    return res.status(400).json({
      error: '전송이 차단되었습니다.',
      reason: 'hate_speech',
    });
  }

  if (result.label === 'offensive') {
    // 경고와 함께 전송 허용 (서비스 정책에 따라 결정)
    return res.json({
      sent: true,
      warning: '욕설이 포함된 메시지입니다.',
    });
  }

  // 정상 전송
  res.json({ sent: true });
});`}
          />
        </Section>

        <Section step={3} title="서버 구현 예시 (Python / FastAPI)">
          <CodeBlock
            language="Python"
            code={`import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI()
PARTYUP_SECRET = os.environ["PARTYUP_CHAT_SECRET_KEY"]

async def analyze_chat(text: str, user_id: str = None) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.party-up.store/api/chat-filter/analyze",
            headers={"Authorization": f"Bearer {PARTYUP_SECRET}"},
            json={"text": text, "user_id": user_id},
        )
    return resp.json()

@app.post("/chat/send")
async def send_chat(message: str, user_id: str):
    result = await analyze_chat(message, user_id)

    if result["label"] == "hate":
        raise HTTPException(400, detail="혐오 발언으로 차단되었습니다.")

    if result["label"] == "offensive":
        return {"sent": True, "warning": "욕설이 포함된 메시지입니다."}

    return {"sent": True}`}
          />
        </Section>

        <Section step={4} title="배치 분석 (여러 메시지 한 번에)">
          <p className="mb-3">
            여러 메시지를 한 번에 분석할 때는 배치 API를 사용하세요. API 호출 횟수를 줄여 사용량을 절약할 수 있습니다.
          </p>
          <h4 className="mb-2 text-sm font-semibold text-gray-800">요청</h4>
          <CodeBlock
            language="HTTP"
            code={`POST https://api.party-up.store/api/chat-filter/analyze/batch
Content-Type: application/json
Authorization: Bearer sk_live_여기에_Secret_Key

{
  "messages": [
    { "id": "msg_1", "text": "안녕하세요!" },
    { "id": "msg_2", "text": "씨발 진짜" },
    { "id": "msg_3", "text": "오늘 파티 같이 해요" }
  ]
}`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">응답</h4>
          <CodeBlock
            language="JSON"
            code={`{
  "results": [
    { "id": "msg_1", "label": "none",      "score": 0.982 },
    { "id": "msg_2", "label": "offensive", "score": 0.960 },
    { "id": "msg_3", "label": "none",      "score": 0.975 }
  ],
  "total_ms": 68
}`}
          />
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600">배치 처리 제한</p>
            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
              <li>• 1회 최대 50개 메시지</li>
              <li>• 메시지당 최대 500자</li>
              <li>• 사용량 카운트: 메시지 수 기준 (50개 배치 = 50건 차감)</li>
            </ul>
          </div>
        </Section>

        <Section step={5} title="기술 아키텍처 (3단계 파이프라인)">
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">단계</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">모듈</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">처리 방식</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">통과 조건</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">1단계</td>
                  <td className="px-3 py-2 text-gray-600">블랙리스트 필터</td>
                  <td className="px-3 py-2 text-gray-600">키워드 직접 매칭</td>
                  <td className="px-3 py-2 text-gray-600">화이트리스트 포함 시 즉시 통과</td>
                </tr>
                <tr className="border-t bg-emerald-50">
                  <td className="px-3 py-2 font-medium text-emerald-700">2단계</td>
                  <td className="px-3 py-2 text-emerald-700">KR-ELECTRA (ML)</td>
                  <td className="px-3 py-2 text-emerald-600">딥러닝 분류 모델</td>
                  <td className="px-3 py-2 text-emerald-600">none 확률 ≥ 0.95 → 통과</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">3단계</td>
                  <td className="px-3 py-2 text-gray-600">Ollama LLM</td>
                  <td className="px-3 py-2 text-gray-600">프롬프트 기반 재판단</td>
                  <td className="px-3 py-2 text-gray-600">경계 케이스 처리 (2단계 통과 못한 경우)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600">모델 성능 (KR-ELECTRA 파인튜닝)</p>
            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
              <li>• 학습 데이터: 약 22만 건 (뉴스 댓글, 소셜 미디어, 온라인 커뮤니티)</li>
              <li>• F1-Macro: 0.7421 / F1-Weighted: 0.7420</li>
              <li>• 평균 추론 속도: 24.4ms / 메시지 (Tesla T4 기준)</li>
            </ul>
          </div>
        </Section>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
        <p className="text-sm text-gray-600">
          연동 중 문제가 있으신가요?{' '}
          <button
            onClick={() => navigate('/saas/chat')}
            className="font-medium text-emerald-600 hover:underline"
          >
            플랜 문의
          </button>
          를 통해 문의해 주세요.
        </p>
      </div>
    </div>
  );
}
