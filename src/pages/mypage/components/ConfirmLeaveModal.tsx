import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveParty } from '../../../apis/party';
import { errorMessage } from './MemberPickerModal';

interface ConfirmLeaveModalProps {
  partyId: string;
  onClose: () => void;
  onDone: () => void;
}

export function ConfirmLeaveModal({ partyId, onClose, onDone }: ConfirmLeaveModalProps) {
  const queryClient = useQueryClient();
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => leaveParty(partyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-parties'] });
      onDone();
    },
    onError: (e) => setErrMsg(errorMessage(e, '탈퇴 처리 중 오류가 발생했습니다.')),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[420px] rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-[20px] font-extrabold text-slate-900">파티에서 탈퇴하시겠습니까?</h3>
        <p className="mt-2 text-sm font-medium text-slate-500">
          탈퇴 후에는 다시 리더의 승인이 있어야 참여할 수 있습니다.
        </p>

        {errMsg && <p className="mt-3 text-sm font-semibold text-red-500">{errMsg}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="h-12 flex-1 rounded-full border border-slate-200 bg-white text-sm font-extrabold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            onClick={onClose}
            disabled={mut.isPending}
          >
            취소
          </button>
          <button
            type="button"
            className="h-12 flex-1 rounded-full bg-red-500 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-50"
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
          >
            {mut.isPending ? '처리 중…' : '탈퇴'}
          </button>
        </div>
      </div>
    </div>
  );
}
