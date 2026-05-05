import { useState } from 'react';
import { X } from 'lucide-react';
import { submitAppeal } from '../apis/admin/adminAppeals';

type Props = {
  banType?: string;
  banRefId?: string;
  onClose: () => void;
};

export default function AppealModal({ banType = 'manual', banRefId, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('이의제기 사유를 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await submitAppeal({
        ban_type: banType,
        ban_reference_id: banRefId ?? null,
        reason: reason.trim(),
      });
      setIsDone(true);
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      if (msg === '이미 해당 제재에 대한 이의제기가 접수되어 있습니다.') {
        setError(msg);
      } else {
        setError('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">이의제기 신청</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {isDone ? (
          <div className="py-6 text-center">
            <p className="text-base font-semibold text-green-600">이의제기가 접수되었습니다.</p>
            <p className="mt-1 text-sm text-gray-500">검토 후 결과를 알림으로 알려드릴게요.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-gray-800 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-500">
              제재에 불복하는 사유를 작성해주세요. 관리자가 검토 후 처리 결과를 알려드립니다.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="이의제기 사유를 입력하세요 (최대 500자)"
              maxLength={500}
              rows={5}
              className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
            <div className="mt-1 text-right text-xs text-gray-400">{reason.length}/500</div>

            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isSubmitting ? '신청 중...' : '이의제기 신청'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
