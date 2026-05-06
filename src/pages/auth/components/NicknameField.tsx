import { Shuffle } from 'lucide-react';

interface NicknameFieldProps {
  nickname: string;
  nicknameError: string;
  nicknameSuccess: string;
  isGenerating: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRandom: () => void;
}

export function NicknameField({
  nickname,
  nicknameError,
  nicknameSuccess,
  isGenerating,
  onChange,
  onRandom,
}: NicknameFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-600">
        닉네임 <span className="text-red-500">*</span>
      </label>

      <div className="relative">
        <input
          name="nickname"
          type="text"
          placeholder="닉네임 입력"
          value={nickname}
          className={`w-full rounded-lg border p-3 pr-28 focus:outline-none ${
            nicknameSuccess
              ? 'border-blue-500 bg-blue-50'
              : nicknameError
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-blue-500'
          }`}
          onChange={onChange}
          required
        />

        <button
          type="button"
          onClick={onRandom}
          disabled={isGenerating}
          className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:bg-gray-300"
        >
          <Shuffle size={14} />
          {isGenerating ? '생성 중' : '랜덤'}
        </button>
      </div>

      {nicknameError && (
        <p className="mt-1 text-xs text-red-500">{nicknameError}</p>
      )}

      {!nicknameError && nicknameSuccess && (
        <p className="mt-1 text-xs text-blue-600">{nicknameSuccess}</p>
      )}
    </div>
  );
}
