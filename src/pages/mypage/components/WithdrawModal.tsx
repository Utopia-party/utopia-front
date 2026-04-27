import { useState } from 'react';
import { useNavigate } from 'react-router';
import { deleteMyAccount } from '../../../apis/user';
import { useAuthStore } from '../../../stores/authStore';

type WithdrawModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function WithdrawModal({ open, onClose }: WithdrawModalProps) {
  const navigate = useNavigate();
  const withdraw = useAuthStore((state) => state.withdraw);

  const [password, setPassword] = useState('');
  const [agreeText, setAgreeText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!open) return null;

  const canSubmit = agreeText.trim() === '회원탈퇴';

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const ok = window.confirm(
      '정말 회원탈퇴 하시겠습니까? 탈퇴 후 계정 복구가 어려울 수 있습니다.',
    );

    if (!ok) return;

    try {
      setSubmitting(true);
      setErrorMessage('');

      await deleteMyAccount({
        password: password || undefined,
      });

      withdraw();
      alert('회원탈퇴가 완료되었습니다.');
      navigate('/', { replace: true });
    } catch (error) {
      console.error(error);
      setErrorMessage('회원탈퇴 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl">
        <h2 className="text-xl font-extrabold text-slate-900">회원탈퇴</h2>

        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          탈퇴 시 프로필, 활동 내역, 파티 이용 정보가 삭제되거나 비활성 처리될
          수 있습니다.
        </p>

        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
          탈퇴 후에는 같은 계정으로 복구가 어려울 수 있습니다.
        </div>

        <div className="mt-5">
          <label className="text-sm font-bold text-slate-700">
            비밀번호 확인
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호를 입력해주세요"
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-medium outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs font-medium text-slate-400">
            소셜 로그인 계정이면 비밀번호 입력이 필요 없을 수 있습니다.
          </p>
        </div>

        <div className="mt-5">
          <label className="text-sm font-bold text-slate-700">
            확인 문구 입력
          </label>
          <input
            value={agreeText}
            onChange={(event) => setAgreeText(event.target.value)}
            placeholder="회원탈퇴"
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-medium outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs font-medium text-slate-400">
            계속하려면 <span className="font-bold">회원탈퇴</span>를 입력하세요.
          </p>
        </div>

        {errorMessage ? (
          <p className="mt-4 text-sm font-bold text-rose-500">{errorMessage}</p>
        ) : null}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-11 flex-1 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="h-11 flex-1 rounded-full bg-rose-500 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '처리 중...' : '회원탈퇴'}
          </button>
        </div>
      </div>
    </div>
  );
}
