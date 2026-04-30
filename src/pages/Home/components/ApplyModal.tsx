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
        // 모바일에서는 모서리 둥글기와 패딩을 약간 컴팩트하게 조절
        className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-white/30 bg-white p-5 sm:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="py-2 sm:py-4 text-center">
            <div className="mb-3 text-4xl sm:mb-4 sm:text-5xl">📨</div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              신청 완료!
            </h3>
            <p className="mt-2 break-keep text-xs sm:text-sm leading-relaxed sm:leading-6 text-slate-500">
              참여 신청이 접수되었습니다.
              <br />
              파티 리더의 승인을 기다려주세요.
            </p>
            <button
              onClick={onClose}
              // 터치 반응 추가 (active:scale-95)
              className="mt-6 w-full rounded-xl sm:rounded-2xl bg-slate-900 py-3 sm:py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 sm:mb-5">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">
                Join party
              </p>
              <h3 className="mt-1 text-lg sm:mt-2 sm:text-xl font-black text-slate-900">
                파티 참여 신청
              </h3>
              <p className="mt-1.5 break-keep text-xs sm:mt-2 sm:text-sm leading-relaxed sm:leading-6 text-slate-500">
                아래 내용을 확인한 뒤 참여를 진행해주세요.
              </p>
            </div>

            <div className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4 ring-1 ring-slate-100">
              {/* 제목이 길 경우를 대비해 break-keep 및 leading 조정 */}
              <p className="break-keep text-sm sm:text-base font-bold leading-snug text-slate-900">
                <span className="text-indigo-600">[{party.service_name}]</span>{' '}
                {party.title}
              </p>

              <div className="mt-2.5 sm:mt-3 flex flex-col gap-1.5 text-[11px] sm:text-xs text-slate-500">
                {/* 텍스트와 이모지를 깔끔하게 정렬하기 위해 flex 컨테이너 사용 */}
                <p className="flex items-center gap-1.5">
                  <span className="shrink-0 text-sm">👥</span>
                  <span>
                    현재{' '}
                    <strong className="text-slate-700">
                      {party.member_count}/{party.max_members ?? '?'}
                    </strong>
                    명 참여 중
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="shrink-0 text-sm">👤</span>
                  {/* 호스트 닉네임이 길 경우 줄바꿈 방지 */}
                  <span className="truncate">
                    호스트:{' '}
                    <strong className="text-slate-700">
                      {party.host_nickname || '익명'}
                    </strong>
                  </span>
                </p>
                {party.monthly_price != null && party.monthly_price > 0 ? (
                  <p className="flex items-center gap-1.5">
                    <span className="shrink-0 text-sm">💰</span>
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

            <div className="mt-5 sm:mt-6 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl sm:rounded-2xl border border-slate-200 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
              >
                취소
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 rounded-xl sm:rounded-2xl bg-slate-900 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 active:scale-95"
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
