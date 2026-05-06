import type { PartyInfo } from '../../../types/chat';
import type { ProfileDrawerUser } from '../../../types/chat';
import { MemberItem, DetailRow } from './ChatComponents';
import {
  CATEGORY_COLOR,
  PARTY_STATUS_LABEL,
  formatCurrency,
} from '../ChatConstants';

interface ChatSidebarProps {
  partyInfo: PartyInfo | null;
  paymentPreview: {
    amount: number;
    is_quick_match: boolean;
    quick_match_fee_rate: number;
  } | null;
  onMemberClick: (
    e: React.MouseEvent<HTMLElement>,
    user: ProfileDrawerUser,
  ) => void;
}

export function ChatSidebar({
  partyInfo,
  paymentPreview,
  onMemberClick,
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
    <div className="w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-y-auto">
      {/* 멤버 목록 */}
      <div className="p-5 border-b border-border">
        <p className="text-sm font-bold text-foreground mb-3">파티 멤버</p>
        {Array.isArray(partyInfo?.members) && partyInfo.members.length > 0 ? (
          <div className="flex flex-col gap-2">
            {partyInfo.members.map((member) => (
              <MemberItem
                key={member.user_id}
                member={member}
                onClick={(e) =>
                  onMemberClick(e, {
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
      </div>

      {/* 파티 정보 */}
      <div className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {partyInfo?.category_name && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
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

        <p className="text-sm font-bold text-foreground mb-3">파티 정보</p>

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
            <p className="text-[11px] text-indigo-500 text-right">
              빠른매칭 수수료 포함
            </p>
          )}
          {partyInfo?.is_leader &&
            (partyInfo?.leader_discount_rate ?? 0) > 0 && (
              <p className="text-[11px] text-blue-500 text-right">
                방장 할인 적용
              </p>
            )}
          {partyInfo?.has_referrer_discount && (
            <p className="text-[11px] text-green-500 text-right">
              추천인 할인 적용
            </p>
          )}
          {saving != null && (
            <p className="text-[11px] text-emerald-500 text-right font-semibold">
              월 {saving.toLocaleString()}원 절약
            </p>
          )}
          <DetailRow
            label="인원"
            value={`${partyInfo?.member_count ?? '-'} / ${partyInfo?.max_members ?? '-'}`}
          />
        </div>
      </div>
    </div>
  );
}
