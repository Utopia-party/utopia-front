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
          손 포즈 + 랜덤 문자열 기반 멀티모달 실시간 검증 API 연동 방법입니다.
        </p>
      </div>

      {/* 연동 흐름 */}
      <div className="mb-6 rounded-xl border border-violet-100 bg-violet-50 p-5">
        <h3 className="mb-3 text-sm font-semibold text-violet-800">연동 흐름 개요</h3>
        <div className="flex flex-col items-center gap-2 text-xs text-violet-700 sm:flex-row sm:gap-0">
          <div className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-center font-medium">
            ① start 호출<br /><span className="text-violet-500">sessionId + text + pose 수신</span>
          </div>
          <span className="hidden text-violet-400 sm:block">→</span>
          <span className="text-violet-400 sm:hidden">↓</span>
          <div className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-center font-medium">
            ② 사용자 촬영<br /><span className="text-violet-500">손 포즈 + 문자열 카메라 캡처</span>
          </div>
          <span className="hidden text-violet-400 sm:block">→</span>
          <span className="text-violet-400 sm:hidden">↓</span>
          <div className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-center font-medium">
            ③ verify 호출<br /><span className="text-violet-500">passToken 수신 후 서버 검증</span>
          </div>
        </div>
      </div>

      {/* 사전 준비 */}
      <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 p-5">
        <h3 className="mb-2 text-sm font-semibold text-amber-800">사전 준비</h3>
        <ul className="space-y-1 text-sm text-amber-700">
          <li>• 캡챠 SaaS (L2) 페이지에서 API 키를 발급받으세요.</li>
          <li>• 모든 요청에 <code className="rounded bg-amber-100 px-1">X-Saas-Key</code> 헤더로 <strong>Site Key</strong>를 전달합니다.</li>
          <li>• 사용자 브라우저에서 <strong>카메라 권한</strong>이 필요합니다.</li>
          <li>• HTTPS 환경에서만 카메라 API가 동작합니다.</li>
        </ul>
      </div>

      <div className="space-y-4">

        <Section step={1} title="세션 시작 (start)" defaultOpen={true}>
          <p className="mb-3">
            캡챠 세션을 시작합니다. 응답의 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">text</code>와{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">pose</code>를 사용자에게 안내하세요.
          </p>
          <h4 className="mb-2 text-sm font-semibold text-gray-800">요청</h4>
          <CodeBlock
            language="HTTP"
            code={`POST https://api.party-up.store/saas/captcha/handocr/start
X-Saas-Key: pk_live_여기에_Site_Key`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">응답</h4>
          <CodeBlock
            language="JSON"
            code={`{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "text": "A3K7P",
  "pose": "thumbs_up"
}`}
          />
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600">응답 필드</p>
            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
              <li>• <code>sessionId</code>: verify 요청 시 필요, 세션 유효시간 5분</li>
              <li>• <code>text</code>: 사용자가 들어야 할 5자리 랜덤 문자열</li>
              <li>• <code>pose</code>: thumbs_up / palm / fist / v_sign 중 하나</li>
            </ul>
          </div>
        </Section>

        <Section step={2} title="사용자 안내 및 카메라 캡처">
          <p className="mb-3">
            start 응답의 text와 pose를 화면에 표시하고, 사용자가 카메라로 촬영하도록 안내합니다.
          </p>
          <CodeBlock
            language="JavaScript"
            code={`const poseLabel = {
  thumbs_up: '엄지 올리기 👍',
  palm:      '손바닥 펴기 🖐',
  fist:      '주먹 쥐기 ✊',
  v_sign:    'V 사인 ✌',
};

// start 호출
const startRes = await fetch(
  'https://api.party-up.store/saas/captcha/handocr/start',
  { method: 'POST', headers: { 'X-Saas-Key': SITE_KEY } }
);
const { sessionId, text, pose } = await startRes.json();

// 사용자에게 안내
document.getElementById('captcha-text').textContent = text;
document.getElementById('captcha-pose').textContent = poseLabel[pose];

// 카메라 스트림 시작
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
videoEl.srcObject = stream;

// 캡처 버튼 클릭 시 이미지 추출 → verify 호출
captureBtn.addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  canvas.width  = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  canvas.getContext('2d').drawImage(videoEl, 0, 0);
  canvas.toBlob(
    (blob) => verifyCaptcha(sessionId, blob),
    'image/jpeg'
  );
});`}
          />
        </Section>

        <Section step={3} title="이미지 검증 (verify)">
          <p className="mb-3">
            캡처한 이미지를 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">multipart/form-data</code>로 전송합니다.
          </p>
          <h4 className="mb-2 text-sm font-semibold text-gray-800">요청</h4>
          <CodeBlock
            language="HTTP"
            code={`POST https://api.party-up.store/saas/captcha/handocr/verify
X-Saas-Key: pk_live_여기에_Site_Key
Content-Type: multipart/form-data

sessionId=550e8400-e29b-41d4-a716-446655440000
image=<캡처된 이미지 파일>`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">성공 응답</h4>
          <CodeBlock
            language="JSON"
            code={`{
  "success": true,
  "message": "인증이 완료되었습니다.",
  "passToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">실패 응답 예시</h4>
          <CodeBlock
            language="JSON"
            code={`{
  "success": false,
  "message": "손 포즈와 5자리 문자가 모두 선명하게 보이도록 다시 촬영해주세요.",
  "failureReason": { "type": "POSE_MISMATCH" }
}`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">JavaScript 구현 예시</h4>
          <CodeBlock
            language="JavaScript"
            code={`async function verifyCaptcha(sessionId, imageBlob) {
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('image', imageBlob, 'captcha.jpg');

  const res = await fetch(
    'https://api.party-up.store/saas/captcha/handocr/verify',
    {
      method: 'POST',
      headers: { 'X-Saas-Key': SITE_KEY },
      body: formData,
    }
  );
  const result = await res.json();

  if (result.success) {
    // passToken을 서버로 전달
    await submitWithToken(result.passToken);
  } else {
    alert(result.message);
    // 실패 시 start부터 재시도
  }
}`}
          />
        </Section>

        <Section step={4} title="서버에서 passToken 검증">
          <p className="mb-3">
            클라이언트에서 받은 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">passToken</code>을
            파트너 서버에서 Party-Up API로 검증합니다.
          </p>
          <h4 className="mb-2 text-sm font-semibold text-gray-800">Node.js 예시</h4>
          <CodeBlock
            language="JavaScript (Node.js)"
            code={`app.post('/submit', async (req, res) => {
  const { passToken } = req.body;

  const verify = await fetch(
    'https://api.party-up.store/saas/captcha/handocr/siteverify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Saas-Key': process.env.PARTYUP_L2_SITE_KEY,
      },
      body: JSON.stringify({ token: passToken, remoteip: req.ip }),
    }
  );
  const result = await verify.json();

  if (!result.success) {
    return res.status(403).json({ error: 'L2 캡챠 인증 실패' });
  }
  // 정상 처리
});`}
          />
          <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">Python / FastAPI 예시</h4>
          <CodeBlock
            language="Python"
            code={`@app.post("/submit")
async def submit(pass_token: str, request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.party-up.store/saas/captcha/handocr/siteverify",
            headers={"X-Saas-Key": PARTYUP_L2_SITE_KEY},
            json={"token": pass_token},
        )
    if not resp.json().get("success"):
        raise HTTPException(403, "L2 캡챠 인증 실패")
    # 정상 처리`}
          />
        </Section>

        <Section step={5} title="기술 아키텍처">
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
                  ['손 포즈 인식', 'MediaPipe HandLandmarker', '21개 손 랜드마크로 포즈 분류'],
                  ['문자 인식', 'PaddleOCR', '손에 든 문자열 OCR 추출 및 일치 검증'],
                  ['적대적 노이즈', 'PGD Algorithm', 'AI 자동화 우회 차단을 위한 이미지 perturbation'],
                  ['세션 관리', 'Redis', '세션 유효시간 5분, IP 기반 중복 세션 방지'],
                  ['토큰 발급', 'JWT (RS256)', '검증 결과를 서명된 passToken으로 발급'],
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
          <button onClick={() => navigate('/saas/l2')} className="font-medium text-violet-600 hover:underline">
            플랜 문의
          </button>
          를 통해 문의해 주세요.
        </p>
      </div>
    </div>
  );
}
