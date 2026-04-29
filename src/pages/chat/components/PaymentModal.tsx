import { useState, useEffect } from 'react';
import { api } from '../../../apis/api';
import type { PaymentStep } from '../../../types/chat';
import {
  PORTONE_STORE_ID,
  PORTONE_CHANNEL_KEY,
  BANK_INFO,
} from '../ChatConstants';

interface PaymentModalProps {
  onClose: () => void;
  partyId: string;
  partyTitle: string;
  nickname: string;
  monthlyPerPerson: number | null;
  paymentPreviewAmount?: number | null;
  isQuickMatchPrice?: boolean;
  isLeader: boolean;
  hasReferrerDiscount: boolean;
  leaderDiscountRate: number | null;
  referralDiscountRate: number | null;
  onPaymentComplete: () => void;
}

export function PaymentModal({
  onClose,
  partyId,
  partyTitle,
  nickname,
  monthlyPerPerson,
  paymentPreviewAmount,
  isQuickMatchPrice = false,
  isLeader,
  hasReferrerDiscount,
  leaderDiscountRate,
  referralDiscountRate,
  onPaymentComplete,
}: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');

  const base = monthlyPerPerson ?? 0;
  if (!base) return null;

  const hasLeaderDiscount =
    isLeader && !!leaderDiscountRate && leaderDiscountRate > 0;
  const hasDiscount = hasLeaderDiscount || hasReferrerDiscount;

  let discountRate = 0;
  if (hasLeaderDiscount) discountRate += leaderDiscountRate ?? 0;
  if (hasReferrerDiscount) discountRate += referralDiscountRate ?? 0;
  discountRate = Math.min(discountRate, 1);

  const payAmount =
    paymentPreviewAmount ?? Math.round(base * (1 - discountRate));

  useEffect(() => {
    if (document.getElementById('portone-sdk')) return;
    const script = document.createElement('script');
    script.id = 'portone-sdk';
    script.src = 'https://cdn.portone.io/v2/browser-sdk.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const handleCardPayment = async () => {
    if (!window.PortOne) {
      alert('결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIsLoading(true);
    const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const response = await window.PortOne.requestPayment({
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_CHANNEL_KEY,
        paymentId: orderId,
        orderName: `${partyTitle} 정산`,
        totalAmount: payAmount,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
        customer: { fullName: nickname },
      });

      if (!response) {
        alert('결제가 취소되었습니다.');
        return;
      }
      if (response?.code) {
        alert(`결제 실패: ${response.message ?? '알 수 없는 오류'}`);
        return;
      }

      await api.post('/api/payments/card/confirm', {
        party_id: partyId,
        pg_transaction_id: response?.paymentId ?? orderId,
        amount: payAmount,
      });

      setDoneMessage('카드 결제가 완료되었습니다!\n결제 승인이 확인되었어요.');
      setDone(true);
      onPaymentComplete();
    } catch (err: unknown) {
      const detail =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response
              ?.data?.detail
          : undefined;
      alert(detail ?? '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferRegister = async () => {
    setIsLoading(true);
    try {
      await api.post('/api/payments/transfer/register', {
        party_id: partyId,
        amount: payAmount,
      });
      setDoneMessage(
        '입금 정보가 등록되었습니다.\n관리자 확인 후 승인으로 변경됩니다.',
      );
      setDone(true);
      onPaymentComplete();
    } catch (err: unknown) {
      const detail =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response
              ?.data?.detail
          : undefined;
      alert(detail ?? '등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(BANK_INFO.account).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const DiscountSummary = () => (
    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex flex-col gap-1.5">
      {hasLeaderDiscount && (
        <div className="flex justify-between text-sm">
          <span className="text-green-700 font-medium">방장 할인</span>
          <span className="text-green-700 font-bold">
            -{Math.round((leaderDiscountRate ?? 0) * 100)}%
          </span>
        </div>
      )}
      {hasReferrerDiscount && (
        <div className="flex justify-between text-sm">
          <span className="text-green-700 font-medium">추천인 할인</span>
          <span className="text-green-700 font-bold">
            -{Math.round((referralDiscountRate ?? 0) * 100)}%
          </span>
        </div>
      )}
      <div className="flex justify-between text-xs text-green-600 border-t border-green-200 pt-1.5 mt-0.5">
        <span>총 할인</span>
        <span className="font-bold">
          -{Math.round(discountRate * 100)}% (
          {Math.max(base - payAmount, 0).toLocaleString()}
          원 절약)
        </span>
      </div>
    </div>
  );

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white">결제 완료</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors text-xl font-light"
            >
              ✕
            </button>
          </div>
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">
              ✅
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900">
                처리 완료!
              </p>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                {doneMessage}
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 w-full py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white">결제</h2>
            <p className="text-xs text-slate-400 mt-0.5">{partyTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl font-light"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {step === 'select' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-600 font-medium">
                결제 수단을 선택해주세요
              </p>
              {hasDiscount && <DiscountSummary />}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStep('card')}
                  className="flex flex-col items-center gap-3 p-5 border-2 border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">
                      카드 결제
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">즉시 승인</p>
                  </div>
                </button>
                <button
                  onClick={() => setStep('transfer')}
                  className="flex flex-col items-center gap-3 p-5 border-2 border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">🏦</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">
                      계좌 입금
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">관리자 승인</p>
                  </div>
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-500">이번 달 결제 금액</span>
                <div className="flex items-center gap-2">
                  {hasDiscount && (
                    <span className="text-xs text-slate-400 line-through">
                      {base.toLocaleString()}원
                    </span>
                  )}
                  <div className="flex flex-col items-end">
                    <span className="font-extrabold text-slate-900">
                      {payAmount.toLocaleString()}원
                    </span>
                    {isQuickMatchPrice && (
                      <p className="text-[11px] text-indigo-500">
                        빠른매칭 수수료 포함
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'card' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">파티명</span>
                  <span className="font-semibold text-slate-800">
                    {partyTitle}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">결제자</span>
                  <span className="font-semibold text-slate-800">
                    {nickname}
                  </span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">정가</span>
                    <span className="text-slate-400 line-through">
                      {base.toLocaleString()}원
                    </span>
                  </div>
                )}
                {hasLeaderDiscount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">
                      방장 할인
                    </span>
                    <span className="text-green-600 font-bold">
                      -{Math.round((leaderDiscountRate ?? 0) * 100)}%
                    </span>
                  </div>
                )}
                {hasReferrerDiscount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">
                      추천인 할인
                    </span>
                    <span className="text-green-600 font-bold">
                      -{Math.round((referralDiscountRate ?? 0) * 100)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-1">
                  <span className="text-slate-500">결제 금액</span>
                  <div className="flex flex-col items-end">
                    <span className="font-extrabold text-primary text-base">
                      {payAmount.toLocaleString()}원
                    </span>
                    {isQuickMatchPrice && (
                      <p className="text-[11px] text-indigo-500">
                        빠른매칭 수수료 포함
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-700 font-medium">
                  💳 카드 결제 후 즉시 승인
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  결제 완료 시 자동으로 승인 처리됩니다.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  이전
                </button>
                <button
                  onClick={handleCardPayment}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      처리중...
                    </>
                  ) : (
                    '결제하기 💳'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'transfer' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  입금 계좌 정보
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">은행</span>
                  <span className="font-semibold">{BANK_INFO.bank}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500">계좌번호</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">
                      {BANK_INFO.account}
                    </span>
                    <button
                      onClick={handleCopyAccount}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20"
                    >
                      {copied ? '복사됨 ✓' : '복사'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">예금주</span>
                  <span className="font-semibold">{BANK_INFO.holder}</span>
                </div>
                {hasLeaderDiscount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">
                      방장 할인
                    </span>
                    <span className="text-green-600 font-bold">
                      -{Math.round((leaderDiscountRate ?? 0) * 100)}%
                    </span>
                  </div>
                )}
                {hasReferrerDiscount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">
                      추천인 할인
                    </span>
                    <span className="text-green-600 font-bold">
                      -{Math.round((referralDiscountRate ?? 0) * 100)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-1">
                  <span className="text-slate-500">입금 금액</span>
                  <div className="flex items-center gap-2">
                    {hasDiscount && (
                      <span className="text-xs text-slate-400 line-through">
                        {base.toLocaleString()}원
                      </span>
                    )}
                    <div className="flex flex-col items-end">
                      <span className="font-extrabold text-slate-900">
                        {payAmount.toLocaleString()}원
                      </span>
                      {isQuickMatchPrice && (
                        <p className="text-[11px] text-indigo-500">
                          빠른매칭 수수료 포함
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium">
                  ⏳ 관리자 확인 후 승인
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  입금 후 아래 버튼을 누르면 관리자가 확인 후 승인 처리합니다.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  이전
                </button>
                <button
                  onClick={handleTransferRegister}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      처리중...
                    </>
                  ) : (
                    '입금 완료했어요 ✓'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
