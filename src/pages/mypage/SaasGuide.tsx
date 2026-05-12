import { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router';

// ── 코드 블록 컴포넌트 ───────────────────────────────────
function CodeBlock({
  code,
  language = '',
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-900">
      {language && (
        <div className="border-b border-gray-700 bg-gray-800 px-4 py-1.5 text-xs text-gray-400">
          {language}
        </div>
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

// ── 아코디언 섹션 ──────────────────────────────────────────
function Section({
  step,
  title,
  children,
  defaultOpen = false,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-gray-50"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          {step}
        </span>
        <span className="flex-1 text-base font-semibold text-gray-900">
          {title}
        </span>
        {open ? (
          <ChevronDown size={18} className="text-gray-400" />
        ) : (
          <ChevronRight size={18} className="text-gray-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-gray-100 px-6 py-5 text-sm leading-relaxed text-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

// ── 메인 가이드 페이지 ─────────────────────────────────────
export default function SaasGuide() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* 헤더 */}
      <button
        onClick={() => navigate('/mypage/developer')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} />
        캡챠 SaaS로 돌아가기
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Party-Up 캡챠 연동 가이드
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          3단계로 파트너 사이트에 Party-Up 캡챠를 연동할 수 있습니다.
        </p>
      </div>

      {/* 아키텍처 개요 */}
      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="mb-3 text-sm font-semibold text-blue-800">
          연동 흐름 개요
        </h3>
        <div className="flex flex-col items-center gap-2 text-xs text-blue-700 sm:flex-row sm:gap-0">
          <div className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-center font-medium">
            ① 사용자 브라우저
            <br />
            <span className="text-blue-500">JS SDK 로드 + 행동 수집</span>
          </div>
          <span className="hidden text-blue-400 sm:block">→</span>
          <span className="text-blue-400 sm:hidden">↓</span>
          <div className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-center font-medium">
            ② Party-Up 서버
            <br />
            <span className="text-blue-500">LSTM 분석 + 토큰 발급</span>
          </div>
          <span className="hidden text-blue-400 sm:block">→</span>
          <span className="text-blue-400 sm:hidden">↓</span>
          <div className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-center font-medium">
            ③ 파트너 서버
            <br />
            <span className="text-blue-500">siteverify로 토큰 검증</span>
          </div>
        </div>
      </div>

      {/* 사전 준비 */}
      <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 p-5">
        <h3 className="mb-2 text-sm font-semibold text-amber-800">사전 준비</h3>
        <ul className="space-y-1 text-sm text-amber-700">
          <li>• 캡챠 SaaS 페이지에서 API 키를 발급받으세요.</li>
          <li>
            • <strong>Site Key</strong> (공개키): 프론트엔드 SDK에 사용
          </li>
          <li>
            • <strong>Secret Key</strong> (비밀키): 서버 간 검증에 사용 (절대
            노출 금지)
          </li>
          <li>
            • 허용 도메인을 정확히 설정하세요 (예:{' '}
            <code className="rounded bg-amber-100 px-1">yourdomain.com</code>)
          </li>
        </ul>
      </div>

      {/* 3단계 가이드 */}
      <div className="space-y-4">
        {/* STEP 1: SDK 설치 */}
        <Section step={1} title="SDK 스크립트 삽입" defaultOpen={true}>
          <p className="mb-3">
            HTML 페이지의{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
              &lt;head&gt;
            </code>{' '}
            또는{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
              &lt;body&gt;
            </code>{' '}
            끝에 SDK 스크립트를 추가합니다.
          </p>

          <CodeBlock
            language="HTML"
            code={`<script defer src="https://api.party-up.store/sdk/partyup-captcha.js"></script>`}
          />

          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600">참고사항</p>
            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
              <li>
                • <code>defer</code> 속성으로 페이지 로딩을 차단하지 않습니다.
              </li>
              <li>
                • SDK는 전역에 <code>PartyUpCaptcha</code> 객체 하나만
                노출합니다 (IIFE 패턴).
              </li>
              <li>• 별도 npm 패키지 설치는 필요 없습니다.</li>
            </ul>
          </div>
        </Section>

        {/* STEP 2: 프론트엔드 삽입 */}
        <Section step={2} title="프론트엔드에 캡챠 위젯 삽입">
          <p className="mb-3">
            캡챠를 표시할 컨테이너 요소를 만들고,{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
              PartyUpCaptcha.render()
            </code>
            를 호출합니다.
          </p>

          <CodeBlock
            language="HTML"
            code={`<!-- 캡챠 컨테이너 -->
<div id="captcha-container"></div>

<!-- 로그인 버튼 (캡챠 통과 전 비활성화) -->
<button id="login-btn" disabled>로그인</button>

<script>
  // SDK 로드 완료 후 실행
  window.addEventListener('load', function() {
    PartyUpCaptcha.render(
      document.getElementById('captcha-container'),
      {
        siteKey: 'pk_live_여기에_발급받은_Site_Key',
        onSuccess: function(token) {
          // 캡챠 통과 시 호출됨
          // token을 서버로 전달하여 검증
          document.getElementById('login-btn').disabled = false;
          document.getElementById('captcha-token').value = token;
        },
        onError: function(error) {
          console.error('캡챠 오류:', error);
        }
      }
    );
  });
</script>`}
          />

          <h4 className="mb-2 mt-5 text-sm font-semibold text-gray-800">
            render() 옵션
          </h4>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    파라미터
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    타입
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    필수
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2 font-mono text-blue-600">siteKey</td>
                  <td className="px-3 py-2 text-gray-500">string</td>
                  <td className="px-3 py-2 text-red-500">필수</td>
                  <td className="px-3 py-2 text-gray-600">
                    발급받은 Site Key (pk_live_...)
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-mono text-blue-600">
                    onSuccess
                  </td>
                  <td className="px-3 py-2 text-gray-500">function</td>
                  <td className="px-3 py-2 text-red-500">필수</td>
                  <td className="px-3 py-2 text-gray-600">
                    인증 성공 콜백, JWT 토큰 전달
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-mono text-blue-600">onError</td>
                  <td className="px-3 py-2 text-gray-500">function</td>
                  <td className="px-3 py-2 text-gray-400">선택</td>
                  <td className="px-3 py-2 text-gray-600">에러 발생 시 콜백</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600">동작 방식</p>
            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
              <li>• SDK가 자동으로 체크박스 UI를 렌더링합니다.</li>
              <li>• 사용자의 마우스/키보드/스크롤 행동 데이터를 수집합니다.</li>
              <li>
                • LSTM 모델이 봇 여부를 판단하고, 의심 시 이미지 챌린지를
                표시합니다.
              </li>
              <li>
                • 인증 통과 시 <code>onSuccess</code>로 JWT 토큰이 전달됩니다.
              </li>
            </ul>
          </div>
        </Section>

        {/* STEP 3: 서버 검증 */}
        <Section step={3} title="서버에서 토큰 검증 (siteverify)">
          <p className="mb-3">
            클라이언트에서 받은 토큰을 파트너 서버에서 Party-Up API로
            검증합니다. reCAPTCHA v2의{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
              siteverify
            </code>
            와 동일한 형식입니다.
          </p>

          <h4 className="mb-2 text-sm font-semibold text-gray-800">요청</h4>
          <CodeBlock
            language="HTTP"
            code={`POST https://api.party-up.store/api/captcha/siteverify
Content-Type: application/json

{
  "secret": "sk_live_여기에_Secret_Key",
  "response": "사용자로부터_받은_JWT_토큰",
  "remoteip": "사용자_IP (선택)"
}`}
          />

          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">
            응답
          </h4>
          <CodeBlock
            language="JSON"
            code={`{
  "success": true,
  "challenge_ts": "2026-05-08T12:34:56Z",
  "hostname": "yourdomain.com",
  "score": 0.92
}`}
          />

          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">
            서버 구현 예시 (Node.js)
          </h4>
          <CodeBlock
            language="JavaScript (Node.js)"
            code={`app.post('/login', async (req, res) => {
  const { captchaToken, email, password } = req.body;

  // 1. Party-Up 토큰 검증
  const verify = await fetch(
    'https://api.party-up.store/api/captcha/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.PARTYUP_SECRET_KEY,
        response: captchaToken,
        remoteip: req.ip
      })
    }
  );
  const result = await verify.json();

  // 2. 검증 실패 시 차단
  if (!result.success) {
    return res.status(403).json({ error: '캡챠 인증 실패' });
  }

  // 3. 점수 기반 추가 판단 (선택)
  if (result.score < 0.3) {
    return res.status(403).json({ error: '의심스러운 요청' });
  }

  // 4. 정상 로그인 처리
  // ...
});`}
          />

          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">
            서버 구현 예시 (Python / FastAPI)
          </h4>
          <CodeBlock
            language="Python"
            code={`import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.post("/login")
async def login(email: str, password: str, captcha_token: str):
    # 1. Party-Up 토큰 검증
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.party-up.store/api/captcha/siteverify",
            json={
                "secret": PARTYUP_SECRET_KEY,
                "response": captcha_token,
            }
        )
    result = resp.json()

    # 2. 검증 실패 시 차단
    if not result.get("success"):
        raise HTTPException(403, "캡챠 인증 실패")

    # 3. 정상 로그인 처리
    # ...`}
          />

          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">
            응답 필드
          </h4>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    필드
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    타입
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2 font-mono text-blue-600">success</td>
                  <td className="px-3 py-2 text-gray-500">boolean</td>
                  <td className="px-3 py-2 text-gray-600">인증 성공 여부</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-mono text-blue-600">
                    challenge_ts
                  </td>
                  <td className="px-3 py-2 text-gray-500">string</td>
                  <td className="px-3 py-2 text-gray-600">
                    챌린지 발급 시각 (ISO 8601)
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-mono text-blue-600">
                    hostname
                  </td>
                  <td className="px-3 py-2 text-gray-500">string</td>
                  <td className="px-3 py-2 text-gray-600">
                    토큰이 발급된 도메인
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-mono text-blue-600">score</td>
                  <td className="px-3 py-2 text-gray-500">float</td>
                  <td className="px-3 py-2 text-gray-600">
                    행동 점수 (0.0=봇 ~ 1.0=사람)
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-mono text-blue-600">
                    error_codes
                  </td>
                  <td className="px-3 py-2 text-gray-500">string[]</td>
                  <td className="px-3 py-2 text-gray-600">
                    실패 시 에러 코드 목록
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* 기술 아키텍처 */}
        <Section step={4} title="기술 아키텍처 (심사위원 참고)">
          <p className="mb-4">
            Party-Up 캡챠는 5계층 보안 파이프라인으로 구성됩니다. 각 계층이
            독립적으로 봇을 판별하며, 최종 점수는 다중 신호 합의 방식으로
            결정됩니다.
          </p>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    계층
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    기술
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    역할
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">L1</td>
                  <td className="px-3 py-2 text-gray-600">Rate Limit</td>
                  <td className="px-3 py-2 text-gray-600">
                    Redis 기반 IP당 요청 제한
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">L2</td>
                  <td className="px-3 py-2 text-gray-600">환경 핑거프린트</td>
                  <td className="px-3 py-2 text-gray-600">
                    WebDriver, Canvas hash, 플러그인 등 브라우저 환경 검사
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">L3</td>
                  <td className="px-3 py-2 text-gray-600">Rule-based 분석</td>
                  <td className="px-3 py-2 text-gray-600">
                    마우스 이동/클릭 통계 기반 규칙 엔진
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">L4</td>
                  <td className="px-3 py-2 text-gray-600">KNN 벡터 유사도</td>
                  <td className="px-3 py-2 text-gray-600">
                    pgvector 기반 기존 봇/사람 벡터와 유사도 비교
                  </td>
                </tr>
                <tr className="border-t bg-blue-50">
                  <td className="px-3 py-2 font-bold text-blue-700">L5</td>
                  <td className="px-3 py-2 font-medium text-blue-700">
                    Bidirectional LSTM
                  </td>
                  <td className="px-3 py-2 text-blue-600">
                    마우스 궤적 시계열 분석 (F1 98.85%)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600">최종 점수 산출</p>
            <p className="mt-1 font-mono text-xs text-gray-500">
              final_score = Rule × 10% + KNN × 20% + LSTM × 70%
            </p>
            <p className="mt-1 text-xs text-gray-500">
              다중 신호 합의: 3개 신호 중 2개 이상 "사람" → block 방지 (오탐
              최소화)
            </p>
          </div>

          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">
            SaaS 키 구조
          </h4>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    키
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    형식
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    용도
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    노출
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium text-green-700">
                    Site Key
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-500">
                    pk_live_...
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    프론트엔드 SDK 초기화
                  </td>
                  <td className="px-3 py-2 text-green-600">공개 가능</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium text-red-700">
                    Secret Key
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-500">
                    sk_live_...
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    서버 간 siteverify 인증
                  </td>
                  <td className="px-3 py-2 text-red-600">절대 비공개</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* 하단 도움말 */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
        <p className="text-sm text-gray-600">
          연동 중 문제가 있으신가요?{' '}
          <button
            onClick={() => navigate('/mypage/developer')}
            className="font-medium text-blue-600 hover:underline"
          >
            플랜 문의
          </button>
          를 통해 문의해 주세요.
        </p>
      </div>
    </div>
  );
}
