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
}

function formatTimer(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function EmailField({
  email, emailCode, isEmailRequesting, isEmailCodeSent, isEmailVerified,
  emailTimer, emailError, emailSuccess, onChange, onRequest, onVerify,
}: EmailFieldProps) {
  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-600">
          이메일 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            name="email" type="email" placeholder="name@email.com" value={email}
            className={`w-full rounded-lg border p-3 pr-28 focus:outline-none ${
              isEmailVerified ? 'border-green-500 bg-green-50'
                : emailError ? 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-blue-500'
            }`}
            onChange={onChange}
            disabled={isEmailVerified || isEmailRequesting}
            required
          />
          <button
            type="button" onClick={onRequest}
            disabled={!email || !!emailError || isEmailVerified || isEmailRequesting}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:bg-gray-300"
          >
            {isEmailRequesting ? '발송 중' : isEmailVerified ? '완료' : isEmailCodeSent ? '재전송' : '인증요청'}
          </button>
        </div>
        {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
        {!emailError && emailSuccess && <p className="mt-1 text-xs text-green-600">{emailSuccess}</p>}
      </div>

      {!isEmailVerified && isEmailCodeSent && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">인증번호</label>
          <div className="relative">
            <input
              name="email_code" type="text" inputMode="numeric" maxLength={6}
              placeholder="인증번호 6자리" value={emailCode}
              className="w-full rounded-lg border border-gray-300 p-3 pr-20 focus:border-blue-500 focus:outline-none"
              onChange={onChange}
            />
            <button
              type="button" onClick={onVerify}
              disabled={!emailCode || emailTimer <= 0}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              확인
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <p className="text-gray-500">메일로 받은 인증번호를 입력해주세요.</p>
            <p className={emailTimer <= 30 ? 'text-red-500' : 'text-blue-600'}>남은 시간 {formatTimer(emailTimer)}</p>
          </div>
        </div>
      )}
    </>
  );
}
