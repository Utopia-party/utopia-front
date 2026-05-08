import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, MailCheck, UsersRound, WalletCards } from 'lucide-react';
import { useState } from 'react';
import type { Party } from '../../../types/party';
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
        className="w-full max-w-md rounded-2xl border border-white/30 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="py-2 text-center sm:py-4">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 sm:mb-4 sm:h-16 sm:w-16">
              <MailCheck className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.25} />
            </div>

            <h3 className="text-lg font-black text-slate-900 sm:text-xl">
              신청 완료!
            </h3>

            <p className="mt-2 break-keep text-xs leading-relaxed text-slate-500 sm:text-sm sm:leading-6">
              참여 신청이 접수되었습니다.
              <br />
              파티 리더의 승인을 기다려주세요.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95 sm:rounded-2xl sm:py-3.5"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 sm:mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 sm:text-xs">
                Join party
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-900 sm:mt-2 sm:text-xl">
                파티 참여 신청
              </h3>

              <p className="mt-1.5 break-keep text-xs leading-relaxed text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">
                아래 내용을 확인한 뒤 참여를 진행해주세요.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 sm:rounded-2xl sm:p-4">
              <p className="break-keep text-sm font-bold leading-snug text-slate-900 sm:text-base">
                <span className="text-indigo-600">[{party.service_name}]</span>{' '}
                {party.title}
              </p>

              <div className="mt-2.5 flex flex-col gap-1.5 text-[11px] text-slate-500 sm:mt-3 sm:text-xs">
                <p className="flex items-center gap-1.5">
                  <UsersRound
                    className="h-4 w-4 shrink-0 text-slate-400"
                    strokeWidth={2.25}
                  />
                  <span>
                    현재{' '}
                    <strong className="text-slate-700">
                      {party.member_count}/{party.max_members ?? '?'}
                    </strong>
                    명 참여 중
                  </span>
                </p>

                <p className="flex items-center gap-1.5">
                  <Crown
                    className="h-4 w-4 shrink-0 text-slate-400"
                    strokeWidth={2.25}
                  />
                  <span className="truncate">
                    호스트:{' '}
                    <strong className="text-slate-700">
                      {party.host_nickname || '익명'}
                    </strong>
                  </span>
                </p>

                {party.monthly_price != null && party.monthly_price > 0 ? (
                  <p className="flex items-center gap-1.5">
                    <WalletCards
                      className="h-4 w-4 shrink-0 text-slate-400"
                      strokeWidth={2.25}
                    />
                    <span>
                      월{' '}
                      <strong className="text-indigo-600">
                        {party.monthly_price.toLocaleString()}원
                      </strong>
                    </span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex gap-2 sm:mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 sm:rounded-2xl sm:py-3.5 sm:text-sm"
              >
                취소
              </button>

              <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 active:scale-95 sm:rounded-2xl sm:py-3.5 sm:text-sm"
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
