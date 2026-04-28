// import React from 'react';

type MatchingSuccessModalProps = {
  open: boolean;
  matchedParty?: any;
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
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 */}
        <div className="text-center">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-xl font-extrabold text-slate-900">매칭 성공!</h2>
          <p className="mt-1 text-sm text-slate-500">
            조건에 맞는 파티에 자동 참여되었습니다.
          </p>
        </div>

        {/* 파티 정보 */}
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <p className="text-sm font-bold text-slate-900">
              [{matchedParty?.service_name}] {matchedParty?.title}
            </p>

            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <p>
                👥 {matchedParty?.member_count}/{matchedParty?.max_members}명
              </p>
              <p>👤 호스트: {matchedParty?.host_nickname}</p>
              {paymentPreview?.amount != null ? (
                <>
                  <p>💰 월 {paymentPreview.amount.toLocaleString()}원</p>
                  {paymentPreview.is_quick_match && (
                    <p className="text-[11px] text-indigo-500">
                      빠른매칭 수수료 포함 금액
                    </p>
                  )}
                </>
              ) : matchedParty?.monthly_price ? (
                <p>💰 월 {matchedParty.monthly_price.toLocaleString()}원</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            확인
          </button>

          {onGoParty && (
            <button
              onClick={onGoParty}
              className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              파티 보러가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
