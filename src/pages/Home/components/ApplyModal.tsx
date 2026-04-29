import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Party } from '../../../types/party';
import { useState } from 'react';
import { applyParty, partyKeys } from '../../../libs/partyapi';
import type { ApiError } from '../../../types/error';

export default function ApplyModal({
  party,
  onClose,
}: {
  party: Party;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => applyParty(party.id),
    onSuccess: () => {
      setDone(true);
      queryClient.invalidateQueries({ queryKey: partyKeys.all });
    },
    onError: (e: unknown) => {
      const error = e as ApiError;
      const detail = error.response?.data?.detail ?? error.message;
      alert(detail || '참여 신청 중 오류가 발생했습니다.');
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/30 bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="py-4 text-center">
            <div className="mb-4 text-5xl">📨</div>
            <h3 className="text-xl font-black text-slate-900">신청 완료!</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              참여 신청이 접수되었습니다.
              <br />
              파티 리더의 승인을 기다려주세요.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">
                Join party
              </p>
              <h3 className="mt-2 text-xl font-black text-slate-900">
                파티 참여 신청
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                아래 내용을 확인한 뒤 참여를 진행해주세요.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-sm font-bold text-slate-900">
                [{party.service_name}] {party.title}
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <p>
                  👥 현재 {party.member_count}/{party.max_members ?? '?'}명 참여
                  중
                </p>
                <p>👤 호스트: {party.host_nickname || '익명'}</p>
                {party.monthly_price != null && party.monthly_price > 0 ? (
                  <p>💰 월 {party.monthly_price.toLocaleString()}원</p>
                ) : null}
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {mutation.isPending ? '처리 중...' : '신청하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
