/**
 * CaptchaDemo — 캡챠 위젯 테스트/데모 페이지
 * 팀원들이 CaptchaWidget 동작을 확인할 수 있는 페이지
 */
import { useState } from 'react';
import { CaptchaWidget } from '../components/captcha';

export default function CaptchaDemo() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (t: string) => {
    setToken(t);
    setError(null);
  };

  const handleError = (err: string) => {
    setError(err);
    setToken(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Party-Up CAPTCHA Demo
          </h1>
          <p className="text-sm text-gray-500">
            하이브리드 v2+v3 캡챠 위젯 테스트 페이지
          </p>
        </div>

        {/* 가짜 폼 (회원가입 시뮬레이션) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">회원가입</h2>

          <div className="space-y-3 mb-5">
            <input
              type="email"
              placeholder="이메일"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              type="password"
              placeholder="비밀번호"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              type="text"
              placeholder="닉네임"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* 캡챠 위젯 */}
          <div className="flex justify-center mb-5">
            <CaptchaWidget onSuccess={handleSuccess} onError={handleError} />
          </div>

          {/* 토큰 표시 */}
          {token && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs font-medium text-green-700 mb-1">
                JWT 토큰 발급됨:
              </p>
              <p className="text-xs text-green-600 break-all font-mono">
                {token}
              </p>
            </div>
          )}

          {/* 에러 표시 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            disabled={!token}
            className={`
              w-full py-2.5 rounded-lg text-sm font-medium transition-all
              ${
                token
                  ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            가입하기
          </button>
        </div>

        {/* 안내 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            테스트 안내
          </h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>
              - 마우스를 충분히 움직인 후 (2초+) 체크박스를 클릭하면 바로
              통과됩니다 (비간섭 검증 pass)
            </li>
            <li>
              - 페이지 로드 후 바로 체크박스를 클릭하면 이미지 캡챠가 출제됩니다
              (challenge)
            </li>
            <li>- 이모티콘 3마리와 같은 동물 사진을 순서대로 선택하세요</li>
            <li>- Mock 모드: VITE_CAPTCHA_MOCK=false 로 실제 API 연동 가능</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
