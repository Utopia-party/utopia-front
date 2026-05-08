import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import type { PartyInfo, ProfileDrawerUser } from '../../../types/chat';
import { MemberItem, DetailRow } from './ChatComponents';
import {
  CATEGORY_COLOR,
  PARTY_STATUS_LABEL,
  formatCurrency,
} from '../ChatConstants';

function useDeadlineCountdown(deadline: string | null | undefined): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!deadline) { setLabel(null); return; }

    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setLabel('마감'); return; }
      const totalMinutes = Math.floor(diff / 60000);
      const d = Math.floor(totalMinutes / 1440);
      const h = Math.floor((totalMinutes % 1440) / 60);
      const m = totalMinutes % 60;
      if (d > 0) setLabel(`${d}일 ${h}시간 남음`);
      else if (h > 0) setLabel(`${h}시간 ${m}분 남음`);
      else setLabel(`${m}분 남음`);
    };

    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [deadline]);

  return label;
}

interface ChatSidebarProps {
  partyInfo: PartyInfo | null;
  paymentPreview: {
    amount: number;
    is_quick_match: boolean;
    quick_match_fee_rate: number;
  } | null;
  onMemberClick: (
    event: MouseEvent<HTMLElement>,
    user: ProfileDrawerUser,
  ) => void;
  className?: string;
  onClose?: () => void;
}

export function ChatSidebar({
  partyInfo,
  paymentPreview,
  onMemberClick,
  className = '',
  onClose,
}: ChatSidebarProps) {
  const deadlineLabel = useDeadlineCountdown(partyInfo?.payment_deadline);

  const originalPerPerson =
    partyInfo?.monthly_price != null && (partyInfo?.max_members ?? 0) > 0
      ? Math.round(partyInfo.monthly_price / partyInfo.max_members!)
      : null;

  const perPerson =
    paymentPreview != null
      ? paymentPreview.amount
      : partyInfo?.monthly_per_person;

  const saving =
    originalPerPerson != null &&
    perPerson != null &&
    originalPerPerson > perPerson
      ? originalPerPerson - perPerson
      : null;

  return (
    <aside
      className={`min-h-0 min-w-0 flex-col overflow-y-auto bg-card ${className}`}
    >
      {onClose && (
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <p className="text-sm font-extrabold text-foreground">파티 정보</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            닫기
          </button>
        </div>
      )}

      <section className="border-b border-border p-4 sm:p-5">
        <p className="mb-3 text-sm font-bold text-foreground">파티 멤버</p>

        {Array.isArray(partyInfo?.members) && partyInfo.members.length > 0 ? (
          <div className="flex flex-col gap-2">
            {partyInfo.members.map((member) => (
              <MemberItem
                key={member.user_id}
                member={member}
                onClick={(event) =>
                  onMemberClick(event, {
                    user_id: member.user_id,
                    nickname: member.nickname,
                    profile_image: member.profile_image ?? null,
                    role: member.role,
                    status: member.status,
                    trust_score: member.trust_score,
                    joined_at: member.joined_at,
                    payment_status: member.payment_status ?? null,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            참여 중인 멤버 정보가 없습니다.
          </p>
        )}
      </section>

      <section className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {partyInfo?.category_name && (
            <span
              className={`max-w-full truncate rounded-full px-2.5 py-1 text-xs font-bold ${
                CATEGORY_COLOR[partyInfo.category_name] ??
                'bg-slate-100 text-slate-600'
              }`}
            >
              {partyInfo.category_name}
            </span>
          )}

          {partyInfo?.status && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              {PARTY_STATUS_LABEL[partyInfo.status] ?? partyInfo.status}
            </span>
          )}
        </div>

        <p className="mb-3 text-sm font-bold text-foreground">파티 정보</p>

        <div className="space-y-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <DetailRow label="서비스명" value={partyInfo?.service_name ?? '-'} />
          <DetailRow label="파티장" value={partyInfo?.host_nickname ?? '-'} />
          <DetailRow
            label="판매가"
            value={formatCurrency(partyInfo?.monthly_price)}
          />
          <DetailRow
            label="1인 부담"
            value={formatCurrency(perPerson)}
            emphasized
          />

          {(paymentPreview?.is_quick_match ||
            (paymentPreview == null &&
              (partyInfo?.quick_match_fee_rate ?? 0) > 0)) && (
            <p className="text-right text-[11px] text-indigo-500">
              빠른매칭 수수료 포함
            </p>
          )}

          {partyInfo?.is_leader &&
            (partyInfo?.leader_discount_rate ?? 0) > 0 && (
              <p className="text-right text-[11px] text-blue-500">
                방장 할인 적용
              </p>
            )}

          {partyInfo?.has_referrer_discount && (
            <p className="text-right text-[11px] text-green-500">
              추천인 할인 적용
            </p>
          )}

          {saving != null && (
            <p className="text-right text-[11px] font-semibold text-emerald-500">
              월 {saving.toLocaleString()}원 절약
            </p>
          )}

          <DetailRow
            label="인원"
            value={`${partyInfo?.member_count ?? '-'} / ${
              partyInfo?.max_members ?? '-'
            }`}
          />

          {deadlineLabel && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-xs text-slate-500">결제 마감</span>
              <span
                className={`text-xs font-bold ${
                  deadlineLabel === '마감' ? 'text-red-500' : 'text-orange-500'
                }`}
              >
                {deadlineLabel}
              </span>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}

interface ChatSidebarProps {
  partyInfo: PartyInfo | null;
  paymentPreview: {
    amount: number;
    is_quick_match: boolean;
    quick_match_fee_rate: number;
  } | null;
  onMemberClick: (
    event: MouseEvent<HTMLElement>,
    user: ProfileDrawerUser,
  ) => void;
  className?: string;
  onClose?: () => void;
}

export function ChatSidebar({
  partyInfo,
  paymentPreview,
  onMemberClick,
  className = '',
  onClose,
}: ChatSidebarProps) {
  const originalPerPerson =
    partyInfo?.monthly_price != null && (partyInfo?.max_members ?? 0) > 0
      ? Math.round(partyInfo.monthly_price / partyInfo.max_members!)
      : null;

  const perPerson =
    paymentPreview != null
      ? paymentPreview.amount
      : partyInfo?.monthly_per_person;

  const saving =
    originalPerPerson != null &&
    perPerson != null &&
    originalPerPerson > perPerson
      ? originalPerPerson - perPerson
      : null;

  return (
    <aside
      className={`min-h-0 min-w-0 flex-col overflow-y-auto bg-card ${className}`}
    >
      {onClose && (
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <p className="text-sm font-extrabold text-foreground">파티 정보</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            닫기
          </button>
        </div>
      )}

      <section className="border-b border-border p-4 sm:p-5">
        <p className="mb-3 text-sm font-bold text-foreground">파티 멤버</p>

        {Array.isArray(partyInfo?.members) && partyInfo.members.length > 0 ? (
          <div className="flex flex-col gap-2">
            {partyInfo.members.map((member) => (
              <MemberItem
                key={member.user_id}
                member={member}
                onClick={(event) =>
                  onMemberClick(event, {
                    user_id: member.user_id,
                    nickname: member.nickname,
                    profile_image: member.profile_image ?? null,
                    role: member.role,
                    status: member.status,
                    trust_score: member.trust_score,
                    joined_at: member.joined_at,
                    payment_status: member.payment_status ?? null,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            참여 중인 멤버 정보가 없습니다.
          </p>
        )}
      </section>

      <section className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {partyInfo?.category_name && (
            <span
              className={`max-w-full truncate rounded-full px-2.5 py-1 text-xs font-bold ${
                CATEGORY_COLOR[partyInfo.category_name] ??
                'bg-slate-100 text-slate-600'
              }`}
            >
              {partyInfo.category_name}
            </span>
          )}

          {partyInfo?.status && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              {PARTY_STATUS_LABEL[partyInfo.status] ?? partyInfo.status}
            </span>
          )}
        </div>

        <p className="mb-3 text-sm font-bold text-foreground">파티 정보</p>

        <div className="space-y-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <DetailRow label="서비스명" value={partyInfo?.service_name ?? '-'} />
          <DetailRow label="파티장" value={partyInfo?.host_nickname ?? '-'} />
          <DetailRow
            label="판매가"
            value={formatCurrency(partyInfo?.monthly_price)}
          />
          <DetailRow
            label="1인 부담"
            value={formatCurrency(perPerson)}
            emphasized
          />

          {(paymentPreview?.is_quick_match ||
            (paymentPreview == null &&
              (partyInfo?.quick_match_fee_rate ?? 0) > 0)) && (
            <p className="text-right text-[11px] text-indigo-500">
              빠른매칭 수수료 포함
            </p>
          )}

          {partyInfo?.is_leader &&
            (partyInfo?.leader_discount_rate ?? 0) > 0 && (
              <p className="text-right text-[11px] text-blue-500">
                방장 할인 적용
              </p>
            )}

          {partyInfo?.has_referrer_discount && (
            <p className="text-right text-[11px] text-green-500">
              추천인 할인 적용
            </p>
          )}

          {saving != null && (
            <p className="text-right text-[11px] font-semibold text-emerald-500">
              월 {saving.toLocaleString()}원 절약
            </p>
          )}

          <DetailRow
            label="인원"
            value={`${partyInfo?.member_count ?? '-'} / ${
              partyInfo?.max_members ?? '-'
            }`}
          />
        </div>
      </section>
    </aside>
  );
}
