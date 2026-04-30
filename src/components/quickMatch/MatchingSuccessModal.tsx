// import React from 'react';

type MatchedParty = {
  service_name: string;
  title: string;
  member_count: number;
  max_members: number;
  host_nickname?: string;
  monthly_price?: number;
};

type MatchingSuccessModalProps = {
  open: boolean;
  matchedParty?: MatchedParty;
  paymentPreview?: {
    amount: number;
    base_price: number;
    commission_rate: number;
    commission_amount: number;
    pricing_type: string;
    is_quick_match: boolean;
    quick_match_fee_rate: number;
  } | null;
  onClose: () => void;
  onGoParty?: () => void;
};

export default function MatchingSuccessModal({
  open,
  matchedParty,
  paymentPreview,
  onClose,
  onGoParty,
}: MatchingSuccessModalProps) {
  if (!open || !matchedParty) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        // 모바일 여백과 둥글기 반응형 적용
        className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 (축하 메시지) */}
        <div className="text-center">
          <div className="mb-2 sm:mb-3 text-4xl sm:text-5xl">🎉</div>
          <h2 className="break-keep text-lg sm:text-xl font-extrabold text-slate-900">
            매칭 성공!
          </h2>
          <p className="mt-1 sm:mt-1.5 break-keep text-xs sm:text-sm leading-relaxed text-slate-500">
            조건에 맞는 파티에 자동 참여되었습니다.
          </p>
        </div>

        {/* 파티 정보 영역 */}
        <div className="mt-5">
          <div className="rounded-xl sm:rounded-2xl bg-slate-50 p-3.5 sm:p-4 ring-1 ring-slate-100">
            <p className="break-keep text-sm sm:text-base font-bold leading-snug text-slate-900">
              <span className="text-indigo-600">
                [{matchedParty?.service_name}]
              </span>{' '}
              {matchedParty?.title}
            </p>

            <div className="mt-2.5 sm:mt-3 flex flex-col gap-1.5 text-[11px] sm:text-xs text-slate-500">
              {/* 아이콘 정렬을 위한 flex 레이아웃 */}
              <p className="flex items-center gap-1.5">
                <span className="shrink-0 text-sm">👥</span>
                <span>
                  <strong className="text-slate-700">
                    {matchedParty?.member_count}/{matchedParty?.max_members}
                  </strong>
                  명
                </span>
              </p>

              <p className="flex items-center gap-1.5">
                <span className="shrink-0 text-sm">👤</span>
                {/* 닉네임이 길 경우 잘림 처리 */}
                <span className="truncate">
                  호스트:{' '}
                  <strong className="text-slate-700">
                    {matchedParty?.host_nickname || '익명'}
                  </strong>
                </span>
              </p>

              {paymentPreview?.amount != null ? (
                <div className="flex flex-col gap-0.5">
                  <p className="flex items-center gap-1.5">
                    <span className="shrink-0 text-sm">💰</span>
                    <span>
                      월{' '}
                      <strong className="text-indigo-600">
                        {paymentPreview.amount.toLocaleString()}원
                      </strong>
                    </span>
                  </p>
                  {paymentPreview.is_quick_match && (
                    // 수수료 안내 문구가 아이콘 우측 라인에 맞춰지도록 pl-6(패딩) 추가
                    <p className="pl-6 text-[10px] sm:text-[11px] font-medium text-indigo-400">
                      * 빠른매칭 수수료 포함 금액
                    </p>
                  )}
                </div>
              ) : matchedParty?.monthly_price ? (
                <p className="flex items-center gap-1.5">
                  <span className="shrink-0 text-sm">💰</span>
                  <span>
                    월{' '}
                    <strong className="text-indigo-600">
                      {matchedParty.monthly_price.toLocaleString()}원
                    </strong>
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="mt-5 sm:mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl sm:rounded-2xl border border-slate-200 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
          >
            닫기
          </button>

          {onGoParty && (
            <button
              onClick={onGoParty}
              // 주요 액션인 '파티 보러가기' 버튼을 모바일에서 조금 더 넓게 강조 (flex-[2])
              className="flex-[2] sm:flex-1 rounded-xl sm:rounded-2xl bg-slate-900 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg active:scale-95"
            >
              파티 보러가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
