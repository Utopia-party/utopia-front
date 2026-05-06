import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api } from '../../apis/api';
import { getMyParties } from '../../apis/party';
import type { MyParty } from '../../types/party';
import { MemberPickerModal } from './components/MemberPickerModal';
import { ConfirmLeaveModal } from './components/ConfirmLeaveModal';
import { ApplicationsModal } from './components/ApplicationsModal';

const ITEMS_PER_PAGE = 6;

interface PaymentPreview {
  party_id: string;
  base_price: number;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  discount_reason?: string | null;
  pricing_type: 'normal' | 'quick_match';
  is_quick_match: boolean;
  quick_match_fee_rate: number;
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-extrabold text-orange-500">
      {label}
    </span>
  );
}

export default function MyParty() {
  const navigate = useNavigate();
  usePageTitle('내 파티');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-parties'],
    queryFn: getMyParties,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const [modal, setModal] = useState<
    | { type: 'leaveMember'; partyId: string }
    | { type: 'leaveLeader'; partyId: string }
    | { type: 'kick'; partyId: string }
    | { type: 'transfer'; partyId: string }
    | { type: 'applications'; partyId: string }
    | null
  >(null);

  const parties: MyParty[] = data?.parties ?? [];
  const [paymentPreviews, setPaymentPreviews] = useState<
    Record<string, PaymentPreview>
  >({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (parties.length === 0) {
      setPaymentPreviews({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        parties.map(async (party) => {
          try {
            const { data } = await api.get<PaymentPreview>(
              `/api/payments/preview?party_id=${party.id}`,
            );
            return [party.id, data] as const;
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;
      const next: Record<string, PaymentPreview> = {};
      entries.forEach((e) => {
        if (e) next[e[0]] = e[1];
      });
      setPaymentPreviews(next);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [parties]);

  const categories = useMemo(() => {
    const names = parties
      .map((p) => p.category_name)
      .filter((c): c is string => c != null);
    return [...new Set(names)].sort();
  }, [parties]);

  const filteredParties = useMemo(
    () =>
      selectedCategory
        ? parties.filter((p) => p.category_name === selectedCategory)
        : parties,
    [parties, selectedCategory],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredParties.length / ITEMS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedParties = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredParties.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredParties, safeCurrentPage]);
  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

  const closeModal = () => setModal(null);

  return (
    <div className="min-h-full bg-[#f5f7fb] px-10 py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-7">
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
            마이페이지 - 내 파티
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            내 파티 목록
          </p>
        </div>

        {parties.length > 0 && categories.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              className={[
                'rounded-full px-5 py-2 text-sm font-extrabold transition',
                selectedCategory === null
                  ? 'bg-primary text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              ].join(' ')}
              onClick={() => {
                setSelectedCategory(null);
                setCurrentPage(1);
              }}
            >
              전체 ({parties.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={[
                  'rounded-full px-5 py-2 text-sm font-extrabold transition',
                  selectedCategory === cat
                    ? 'bg-primary text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
              >
                {cat} ({parties.filter((p) => p.category_name === cat).length})
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-[30px] bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            불러오는 중…
          </div>
        ) : isError ? (
          <div className="rounded-[30px] bg-white p-10 text-center text-sm text-red-500 shadow-sm">
            목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </div>
        ) : parties.length === 0 ? (
          <div className="rounded-[30px] bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            참여 중인 파티가 없습니다.
          </div>
        ) : filteredParties.length === 0 ? (
          <div className="rounded-[30px] bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            해당 카테고리의 파티가 없습니다.
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              {pagedParties.map((party) => {
                const isOwner = party.is_owner;
                const preview = paymentPreviews[party.id];
                const perPersonPrice =
                  preview?.amount ?? party.monthly_price ?? null;
                const refundAmount =
                  isOwner &&
                  party.service_total_price != null &&
                  party.monthly_price != null
                    ? party.service_total_price - party.monthly_price
                    : null;
                const originalPerPerson =
                  party.original_price != null && (party.max_members ?? 0) > 0
                    ? Math.round(party.original_price / party.max_members!)
                    : null;
                const savingAmount =
                  originalPerPerson != null &&
                  perPersonPrice != null &&
                  originalPerPerson > perPersonPrice
                    ? originalPerPerson - perPersonPrice
                    : null;

                return (
                  <article
                    key={party.id}
                    className="flex min-h-[610px] flex-col rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-600">
                        {party.category_name ?? '카테고리'}
                      </span>
                      <StatusBadge
                        label={isOwner ? '내가 만든 파티' : '참여중'}
                      />
                    </div>

                    {party.service_name && (
                      <p className="mt-4 text-[13px] font-semibold text-slate-400">
                        {party.service_name}
                      </p>
                    )}
                    <h2 className="mt-1 text-[22px] font-extrabold leading-tight text-slate-900">
                      {party.title}
                    </h2>

                    <div className="mt-7 flex flex-col gap-3 text-slate-700">
                      <p className="text-[18px] font-extrabold text-slate-800">
                        👥 {party.member_count}/{party.max_members ?? '?'}
                      </p>
                      <p className="text-[16px] font-bold">📍 온라인</p>
                      <div>
                        <p className="text-[16px] font-extrabold text-slate-800">
                          💰 월 1인 ₩{' '}
                          {perPersonPrice != null
                            ? perPersonPrice.toLocaleString()
                            : '-'}
                        </p>
                        {preview?.is_quick_match && (
                          <p className="mt-1 text-[12px] font-bold text-indigo-500">
                            빠른매칭 수수료 포함
                          </p>
                        )}
                        {isOwner && (party.leader_discount_rate ?? 0) > 0 && (
                          <p className="mt-1 text-[12px] font-bold text-blue-500">
                            방장 할인 적용
                          </p>
                        )}
                        {party.has_referrer_discount && (
                          <p className="mt-1 text-[12px] font-bold text-green-500">
                            추천인 할인 적용
                          </p>
                        )}
                        {savingAmount != null && (
                          <p className="mt-1 text-[12px] font-bold text-emerald-600">
                            월 {savingAmount.toLocaleString()}원 절약
                          </p>
                        )}
                      </div>
                      {isOwner && refundAmount != null && (
                        <p className="text-[15px] font-bold text-emerald-600">
                          💸 결제 후 환급 ₩ {refundAmount.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="mt-7 flex flex-col gap-4">
                      <button
                        type="button"
                        className="h-14 rounded-full border border-slate-200 bg-white text-[16px] font-extrabold text-slate-900 transition hover:bg-slate-50"
                        onClick={() =>
                          setModal(
                            isOwner
                              ? { type: 'leaveLeader', partyId: party.id }
                              : { type: 'leaveMember', partyId: party.id },
                          )
                        }
                      >
                        파티 탈퇴
                      </button>
                      {isOwner && (
                        <>
                          <button
                            type="button"
                            className="h-14 rounded-full border border-amber-200 bg-amber-50 text-[16px] font-extrabold text-amber-700 transition hover:bg-amber-100"
                            onClick={() =>
                              setModal({
                                type: 'applications',
                                partyId: party.id,
                              })
                            }
                          >
                            참여 신청 관리
                          </button>
                          <button
                            type="button"
                            className="h-14 rounded-full border border-blue-200 bg-white text-[16px] font-extrabold text-primary transition hover:bg-blue-50"
                            onClick={() =>
                              setModal({ type: 'kick', partyId: party.id })
                            }
                          >
                            참여자 강퇴
                          </button>
                          <button
                            type="button"
                            className="h-14 rounded-full border border-blue-200 bg-white text-[16px] font-extrabold text-primary transition hover:bg-blue-50"
                            onClick={() =>
                              setModal({ type: 'transfer', partyId: party.id })
                            }
                          >
                            리더 위임
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="h-14 rounded-full border border-blue-200 bg-primary text-[16px] font-extrabold text-white transition hover:opacity-90"
                        onClick={() => navigate(`/party/${party.id}/chat`)}
                      >
                        채팅방
                      </button>
                    </div>

                    <p className="mt-auto pt-5 text-sm font-semibold leading-6 text-slate-500">
                      {isOwner
                        ? '리더 권한: 모집 상태 관리/강퇴/리더 위임/파티 종료(스케줄링)'
                        : '채팅방에서: 정산요청/영수증 인증/채팅 신고 가능'}
                    </p>
                  </article>
                );
              })}
            </section>

            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(Math.max(safeCurrentPage - 1, 1))}
              >
                이전
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={[
                    'h-11 min-w-[44px] rounded-full px-4 text-sm font-extrabold transition',
                    currentPage === page
                      ? 'bg-primary text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safeCurrentPage === totalPages}
                onClick={() =>
                  setCurrentPage(Math.min(safeCurrentPage + 1, totalPages))
                }
              >
                다음
              </button>
            </div>
          </>
        )}
      </div>

      {modal?.type === 'leaveMember' && (
        <ConfirmLeaveModal
          partyId={modal.partyId}
          onClose={closeModal}
          onDone={closeModal}
        />
      )}
      {modal?.type === 'leaveLeader' && (
        <MemberPickerModal
          partyId={modal.partyId}
          mode="leaderLeave"
          onClose={closeModal}
          onDone={closeModal}
        />
      )}
      {modal?.type === 'kick' && (
        <MemberPickerModal
          partyId={modal.partyId}
          mode="kick"
          onClose={closeModal}
          onDone={closeModal}
        />
      )}
      {modal?.type === 'transfer' && (
        <MemberPickerModal
          partyId={modal.partyId}
          mode="transfer"
          onClose={closeModal}
          onDone={closeModal}
        />
      )}
      {modal?.type === 'applications' && (
        <ApplicationsModal partyId={modal.partyId} onClose={closeModal} />
      )}
    </div>
  );
}
