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
          Ollama LLM + KR-ELECTRA 기반 한국어 욕설·혐오 실시간 탐지 API 연동 방법입니다.
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
            ② /saas/chat/check<br /><span className="text-emerald-500">3단계 파이프라인 분석</span>
          </div>
          <span className="hidden text-emerald-400 sm:block">→</span>
          <span className="text-emerald-400 sm:hidden">↓</span>
          <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-center font-medium">
            ③ 결과 처리<br /><span className="text-emerald-500">violation / severe 기반 제재</span>
          </div>
        </div>
      </div>

      {/* 탐지 결과 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">탐지 결과 체계</h3>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">violation</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">severe</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">등급</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">권장 처리</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-2 font-mono text-green-600">false</td>
                <td className="px-3 py-2 font-mono text-gray-400">false</td>
                <td className="px-3 py-2 text-gray-600">정상</td>
                <td className="px-3 py-2 text-gray-600">전송 허용</td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2 font-mono text-amber-600">true</td>
                <td className="px-3 py-2 font-mono text-gray-400">false</td>
                <td className="px-3 py-2 text-gray-600">경고 (offensive)</td>
                <td className="px-3 py-2 text-gray-600">경고 메시지 표시 또는 전송 차단</td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2 font-mono text-red-600">true</td>
                <td className="px-3 py-2 font-mono text-red-600">true</td>
                <td className="px-3 py-2 text-gray-600">즉시 차단 (hate)</td>
                <td className="px-3 py-2 text-gray-600">전송 차단 + 제재</td>
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
          <li>• 요청 헤더에 <code className="rounded bg-amber-100 px-1">X-Saas-Key</code>로 <strong>Site Key</strong>를 전달합니다.</li>
          <li>• <strong>반드시 서버에서 호출하세요.</strong> 프론트엔드에서 직접 호출하면 키가 노출됩니다.</li>
        </ul>
      </div>

      <div className="space-y-4">

        <Section step={1} title="API 호출 방법" defaultOpen={true}>
          <p className="mb-3">
            채팅 메시지를 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">content</code> 필드에 담아 전송합니다.
          </p>
          <h4 className="mb-2 text-sm font-semibold text-gray-800">요청</h4>
          <CodeBlock
            language="HTTP"
            code={`POST https://api.party-up.store/saas/chat/check
Content-Type: application/json
X-Saas-Key: pk_live_여기에_Site_Key

{
  "content": "분석할 채팅 메시지"
}`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">응답 (정상)</h4>
          <CodeBlock
            language="JSON"
            code={`{
  "violation": false,
  "severe": false,
  "reason": "",
  "stage": 2,
  "score": 0.982
}`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">응답 (경고)</h4>
          <CodeBlock
            language="JSON"
            code={`{
  "violation": true,
  "severe": false,
  "reason": "부적절한 표현",
  "stage": 2,
  "score": 0.960
}`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">응답 (즉시 차단)</h4>
          <CodeBlock
            language="JSON"
            code={`{
  "violation": true,
  "severe": true,
  "reason": "혐오/심한 욕설",
  "stage": 2,
  "score": 0.836
}`}
          />
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600">응답 필드</p>
            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
              <li>• <code>violation</code>: 위반 여부</li>
              <li>• <code>severe</code>: true면 즉시 차단 수준 (hate), false면 경고 수준 (offensive)</li>
              <li>• <code>reason</code>: 위반 이유</li>
              <li>• <code>stage</code>: 판정을 내린 파이프라인 단계 (1=블랙리스트, 2=ML, 3=LLM)</li>
              <li>• <code>score</code>: ML 신뢰도 (stage 3은 null)</li>
            </ul>
          </div>
        </Section>

        <Section step={2} title="서버 구현 예시 (Node.js)">
          <CodeBlock
            language="JavaScript (Node.js)"
            code={`app.post('/chat/send', async (req, res) => {
  const { message } = req.body;

  // Party-Up 채팅 필터 호출
  const resp = await fetch('https://api.party-up.store/saas/chat/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Saas-Key': process.env.PARTYUP_CHAT_SITE_KEY,
    },
    body: JSON.stringify({ content: message }),
  });
  const result = await resp.json();

  // 즉시 차단 (hate)
  if (result.violation && result.severe) {
    return res.status(400).json({
      error: '전송이 차단되었습니다.',
      reason: result.reason,
    });
  }

  // 경고 (offensive) - 서비스 정책에 따라 차단 또는 경고
  if (result.violation) {
    return res.status(400).json({
      error: '부적절한 표현이 포함되어 있습니다.',
      reason: result.reason,
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

async def check_chat(content: str) -> dict:
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.post(
            "https://api.party-up.store/saas/chat/check",
            headers={"X-Saas-Key": PARTYUP_CHAT_SITE_KEY},
            json={"content": content},
        )
    return resp.json()

@app.post("/chat/send")
async def send_chat(message: str):
    result = await check_chat(message)

    if result["violation"] and result["severe"]:
        raise HTTPException(400, detail=f"차단: {result['reason']}")

    if result["violation"]:
        raise HTTPException(400, detail=f"경고: {result['reason']}")

    return {"sent": True}`}
          />
        </Section>

        <Section step={4} title="기술 아키텍처 (3단계 파이프라인)">
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">stage</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">모듈</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">처리 방식</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">통과 조건</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">1</td>
                  <td className="px-3 py-2 text-gray-600">블랙리스트 필터</td>
                  <td className="px-3 py-2 text-gray-600">키워드 직접 매칭</td>
                  <td className="px-3 py-2 text-gray-600">화이트리스트 포함 시 즉시 통과</td>
                </tr>
                <tr className="border-t bg-emerald-50">
                  <td className="px-3 py-2 font-medium text-emerald-700">2</td>
                  <td className="px-3 py-2 text-emerald-700">KR-ELECTRA (ML)</td>
                  <td className="px-3 py-2 text-emerald-600">딥러닝 분류</td>
                  <td className="px-3 py-2 text-emerald-600">none 확률 ≥ 0.95 → 통과 / ≥ 0.97 → 즉시 차단</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">3</td>
                  <td className="px-3 py-2 text-gray-600">Ollama LLM</td>
                  <td className="px-3 py-2 text-gray-600">프롬프트 기반 재판단</td>
                  <td className="px-3 py-2 text-gray-600">stage 2 경계 케이스 처리</td>
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
          <button onClick={() => navigate('/saas/chat')} className="font-medium text-emerald-600 hover:underline">
            플랜 문의
          </button>
          를 통해 문의해 주세요.
        </p>
      </div>
    </div>
  );
}
