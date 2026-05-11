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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
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

export default function SaasGuideL2() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <button
        onClick={() => navigate('/saas/l2')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} />
        캡챠 SaaS (L2)로 돌아가기
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Party-Up 캡챠 L2 연동 가이드</h1>
        <p className="mt-2 text-sm text-gray-500">
          손동작 + OCR 기반 멀티모달 실시간 검증을 파트너 사이트에 연동하는 방법입니다.
        </p>
      </div>

      {/* 연동 흐름 */}
      <div className="mb-6 rounded-xl border border-violet-100 bg-violet-50 p-5">
        <h3 className="mb-3 text-sm font-semibold text-violet-800">연동 흐름 개요</h3>
        <div className="flex flex-col items-center gap-2 text-xs text-violet-700 sm:flex-row sm:gap-0">
          <div className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-center font-medium">
            ① 사용자 브라우저<br /><span className="text-violet-500">카메라 + SDK 로드</span>
          </div>
          <span className="hidden text-violet-400 sm:block">→</span>
          <span className="text-violet-400 sm:hidden">↓</span>
          <div className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-center font-medium">
            ② Party-Up 서버<br /><span className="text-violet-500">MediaPipe + OCR 검증</span>
          </div>
          <span className="hidden text-violet-400 sm:block">→</span>
          <span className="text-violet-400 sm:hidden">↓</span>
          <div className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-center font-medium">
            ③ 파트너 서버<br /><span className="text-violet-500">siteverify 토큰 검증</span>
          </div>
        </div>
      </div>

      {/* 사전 준비 */}
      <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 p-5">
        <h3 className="mb-2 text-sm font-semibold text-amber-800">사전 준비</h3>
        <ul className="space-y-1 text-sm text-amber-700">
          <li>• 캡챠 SaaS (L2) 페이지에서 API 키를 발급받으세요.</li>
          <li>• <strong>Site Key</strong> (공개키): 프론트엔드 SDK에 사용</li>
          <li>• <strong>Secret Key</strong> (비밀키): 서버 간 검증에 사용 (절대 노출 금지)</li>
          <li>• 사용자 브라우저에서 <strong>카메라 권한</strong>이 필요합니다.</li>
          <li>• HTTPS 환경에서만 카메라 API가 동작합니다.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <Section step={1} title="SDK 스크립트 삽입" defaultOpen={true}>
          <p className="mb-3">
            HTML 페이지의 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">&lt;head&gt;</code> 또는{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">&lt;body&gt;</code> 끝에 L2 SDK를 추가합니다.
          </p>
          <CodeBlock
            language="HTML"
            code={`<script defer src="https://api.party-up.store/sdk/partyup-captcha-l2.js"></script>`}
          />
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600">L2 SDK 특이사항</p>
            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
              <li>• MediaPipe HandLandmarker가 내장되어 있습니다. (추가 설치 불필요)</li>
              <li>• 첫 로드 시 ML 모델 파일을 다운로드합니다. (~2MB)</li>
              <li>• 카메라 권한 요청은 위젯 렌더링 시점에 발생합니다.</li>
            </ul>
          </div>
        </Section>

        <Section step={2} title="프론트엔드에 L2 위젯 삽입">
          <p className="mb-3">
            사용자는 화면에 표시된 랜덤 문자열을 손으로 들고 카메라에 보여주는 방식으로 인증합니다.
          </p>
          <CodeBlock
            language="HTML"
            code={`<!-- L2 캡챠 컨테이너 -->
<div id="captcha-l2-container"></div>

<button id="submit-btn" disabled>제출</button>

<script>
  window.addEventListener('load', function() {
    PartyUpCaptchaL2.render(
      document.getElementById('captcha-l2-container'),
      {
        siteKey: 'pk_live_여기에_발급받은_Site_Key',
        onSuccess: function(token) {
          // 인증 통과 - 서버로 토큰 전달
          document.getElementById('submit-btn').disabled = false;
          document.getElementById('captcha-token').value = token;
        },
        onError: function(error) {
          console.error('L2 캡챠 오류:', error);
        },
        // 선택 옵션
        lang: 'ko',           // 'ko' | 'en' (기본값: 'ko')
        timeout: 30,          // 미션 제한시간(초), 기본값 30
      }
    );
  });
</script>`}
          />

          <h4 className="mb-2 mt-5 text-sm font-semibold text-gray-800">render() 옵션</h4>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">파라미터</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">타입</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">필수</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">설명</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['siteKey', 'string', '필수', '발급받은 Site Key (pk_live_...)'],
                  ['onSuccess', 'function', '필수', '인증 성공 콜백, JWT 토큰 전달'],
                  ['onError', 'function', '선택', '에러 발생 시 콜백'],
                  ['lang', 'string', '선택', "'ko' | 'en' (기본값: 'ko')"],
                  ['timeout', 'number', '선택', '미션 제한시간 초, 기본값 30'],
                ].map(([param, type, req, desc]) => (
                  <tr key={param} className="border-t">
                    <td className="px-3 py-2 font-mono text-violet-600">{param}</td>
                    <td className="px-3 py-2 text-gray-500">{type}</td>
                    <td className={`px-3 py-2 ${req === '필수' ? 'text-red-500' : 'text-gray-400'}`}>{req}</td>
                    <td className="px-3 py-2 text-gray-600">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600">L2 인증 동작 방식</p>
            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
              <li>• 화면에 랜덤 문자열(4~6자)이 표시됩니다.</li>
              <li>• 사용자가 해당 문자열을 종이/손가락으로 들고 카메라에 보여줍니다.</li>
              <li>• MediaPipe HandLandmarker로 손 포즈를 인식합니다.</li>
              <li>• PaddleOCR로 문자열 일치 여부를 검증합니다.</li>
              <li>• 두 조건 모두 통과 시 onSuccess 콜백이 호출됩니다.</li>
            </ul>
          </div>
        </Section>

        <Section step={3} title="서버에서 토큰 검증 (siteverify)">
          <p className="mb-3">
            L1과 동일한 siteverify 엔드포인트를 사용하며, 응답에 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">type: "l2"</code> 필드가 추가됩니다.
          </p>
          <h4 className="mb-2 text-sm font-semibold text-gray-800">요청</h4>
          <CodeBlock
            language="HTTP"
            code={`POST https://api.party-up.store/api/captcha-l2/siteverify
Content-Type: application/json

{
  "secret": "sk_live_여기에_Secret_Key",
  "response": "사용자로부터_받은_JWT_토큰",
  "remoteip": "사용자_IP (선택)"
}`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">응답</h4>
          <CodeBlock
            language="JSON"
            code={`{
  "success": true,
  "type": "l2",
  "challenge_ts": "2026-05-08T12:34:56Z",
  "hostname": "yourdomain.com",
  "hand_detected": true,
  "ocr_matched": true
}`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">서버 구현 예시 (Node.js)</h4>
          <CodeBlock
            language="JavaScript (Node.js)"
            code={`app.post('/submit', async (req, res) => {
  const { captchaToken } = req.body;

  const verify = await fetch(
    'https://api.party-up.store/api/captcha-l2/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.PARTYUP_L2_SECRET_KEY,
        response: captchaToken,
        remoteip: req.ip
      })
    }
  );
  const result = await verify.json();

  if (!result.success) {
    return res.status(403).json({ error: 'L2 캡챠 인증 실패' });
  }

  // hand_detected, ocr_matched 추가 검증 가능
  if (!result.hand_detected || !result.ocr_matched) {
    return res.status(403).json({ error: '손동작 또는 문자 인식 실패' });
  }

  // 정상 처리
});`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">서버 구현 예시 (Python / FastAPI)</h4>
          <CodeBlock
            language="Python"
            code={`@app.post("/submit")
async def submit(captcha_token: str):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.party-up.store/api/captcha-l2/siteverify",
            json={
                "secret": PARTYUP_L2_SECRET_KEY,
                "response": captcha_token,
            }
        )
    result = resp.json()

    if not result.get("success"):
        raise HTTPException(403, "L2 캡챠 인증 실패")

    if not result.get("hand_detected") or not result.get("ocr_matched"):
        raise HTTPException(403, "손동작 또는 문자 인식 실패")

    # 정상 처리`}
          />
        </Section>

        <Section step={4} title="기술 아키텍처">
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">모듈</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">기술</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">역할</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['손 인식', 'MediaPipe HandLandmarker', '21개 손 랜드마크 실시간 검출'],
                  ['문자 인식', 'PaddleOCR', '손에 들고 있는 문자열 OCR 추출'],
                  ['적대적 노이즈', 'PGD Algorithm', 'AI 자동화 우회 방지를 위한 이미지 perturbation'],
                  ['토큰 발급', 'JWT (RS256)', '검증 결과를 서명된 토큰으로 발급'],
                ].map(([mod, tech, role]) => (
                  <tr key={mod} className="border-t">
                    <td className="px-3 py-2 font-medium text-violet-700">{mod}</td>
                    <td className="px-3 py-2 text-gray-600">{tech}</td>
                    <td className="px-3 py-2 text-gray-600">{role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
        <p className="text-sm text-gray-600">
          연동 중 문제가 있으신가요?{' '}
          <button
            onClick={() => navigate('/saas/l2')}
            className="font-medium text-violet-600 hover:underline"
          >
            플랜 문의
          </button>
          를 통해 문의해 주세요.
        </p>
      </div>
    </div>
  );
}
