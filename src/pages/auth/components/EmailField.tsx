import { useEffect, useMemo, useRef } from 'react';

interface EmailFieldProps {
  email: string;
  emailCode: string;
  isEmailRequesting: boolean;
  isEmailCodeSent: boolean;
  isEmailVerified: boolean;
  emailTimer: number;
  emailError: string;
  emailSuccess: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRequest: () => void;
  onVerify: () => void;
  className?: string;
}

export function EmailField({
  email,
  emailCode,
  isEmailRequesting,
  isEmailCodeSent,
  isEmailVerified,
  emailTimer,
  emailError,
  emailSuccess,
  onChange,
  onRequest,
  onVerify,
  className = '',
}: EmailFieldProps) {
  const emailCodeInputRef = useRef<HTMLInputElement | null>(null);

  const [minutes, seconds] = useMemo(() => {
    const mins = Math.floor(emailTimer / 60);
    const secs = emailTimer % 60;

    return [mins, secs];
  }, [emailTimer]);

  useEffect(() => {
    if (isEmailCodeSent && !isEmailVerified) {
      emailCodeInputRef.current?.focus();
    }
  }, [isEmailCodeSent, isEmailVerified]);

  return (
    <div className={className}>
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          이메일 <span className="text-red-500">*</span>
        </label>

        <div className="flex items-start gap-2">
          <div className="flex-1">
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="name@email.com"
              disabled={isEmailVerified}
              className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition ${
                emailError
                  ? 'border-red-500 focus:border-red-500'
                  : isEmailVerified
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 focus:border-blue-500'
              }`}
            />

            {emailError ? (
              <p className="mt-1 text-xs text-red-500">{emailError}</p>
            ) : emailSuccess ? (
              <p className="mt-1 text-xs text-blue-600">{emailSuccess}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onRequest}
            disabled={isEmailRequesting || isEmailVerified}
            className="h-[46px] shrink-0 rounded-lg bg-gray-800 px-4 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isEmailRequesting
              ? '발송 중...'
              : isEmailVerified
                ? '인증 완료'
                : '인증요청'}
          </button>
        </div>
      </div>

      {!isEmailVerified && isEmailCodeSent && (
        <div className="mb-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            인증번호 <span className="text-red-500">*</span>
          </label>

          <div className="flex items-start gap-2">
            <div className="relative flex-1">
              <input
                ref={emailCodeInputRef}
                type="text"
                name="email_code"
                value={emailCode}
                onChange={onChange}
                placeholder="인증번호 6자리 입력"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-20 text-sm outline-none transition focus:border-blue-500"
              />

              <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-medium text-red-500">
                {minutes}:{String(seconds).padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              onClick={onVerify}
              className="h-[46px] shrink-0 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              인증확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
