import { useState } from 'react';
import {
  User,
  AlertTriangle,
  Heart,
  CreditCard,
  CalendarDays,
  ShieldCheck,
  UserMinus,
} from 'lucide-react';
import type { Member, ProfileDrawerUser } from '../../../types/chat';
import {
  getProfileInitial,
  displayMemberName,
  displayMemberSubLabel,
  ROLE_LABEL,
  MEMBER_STATUS_LABEL,
} from '../ChatConstants';

export function Avatar({
  nickname,
  profileImage,
  size = 'sm',
  onClick,
}: {
  nickname?: string | null;
  profileImage?: string | null;
  size?: 'sm' | 'md';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';

  const content =
    profileImage && !imgError ? (
      <img
        src={profileImage}
        alt={nickname ?? 'profile'}
        onError={() => setImgError(true)}
        className="h-full w-full object-cover"
      />
    ) : (
      getProfileInitial(nickname)
    );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title="프로필 열기"
        className={`${sizeClass} flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary font-extrabold text-white transition-transform hover:scale-105 active:scale-95`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-extrabold text-white`}
    >
      {content}
    </div>
  );
}

export function ProfileDrawer({
  user,
  top,
  left,
  isMe,
  onClose,
  onProfileInfo,
  onReport,
  onPraise,
  onKick,
  praiseDisabled = false,
  praiseDisabledLabel = '30일 뒤 다시 가능',
  canKick = false,
}: {
  user: ProfileDrawerUser;
  top: number;
  left: number;
  isMe: boolean;
  onClose: () => void;
  onProfileInfo: () => void;
  onReport: () => void;
  onPraise?: () => void;
  onKick?: () => void;
  praiseDisabled?: boolean;
  praiseDisabledLabel?: string;
  canKick?: boolean;
}) {
  const paymentStatusLabel =
    user.payment_status === 'completed' ? '결제 완료' : '결제 미완료';
  const paymentStatusTone =
    user.payment_status === 'completed' ? 'text-emerald-600' : 'text-amber-600';

  return (
    <div className="fixed inset-0 z-70" onClick={onClose}>
      <div
        className="absolute max-w-[calc(100vw-32px)] overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur-md"
        style={{
          top,
          left: Math.min(left, window.innerWidth - 296),
          width: 280,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Avatar
              nickname={user.nickname}
              profileImage={user.profile_image}
              size="md"
            />

            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-900">
                {user.nickname ?? '익명'}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                {user.role && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                )}

                {user.status && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {MEMBER_STATUS_LABEL[user.status] ?? user.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200" />

        <button
          type="button"
          onClick={onProfileInfo}
          className="flex w-full items-center gap-3 px-5 py-4 text-left text-base font-semibold text-slate-800 hover:bg-slate-50"
        >
          <User size={18} className="text-slate-500" />
          프로필 정보
        </button>

        {!isMe && (
          <>
            <div className="mx-5 h-px bg-slate-200" />

            <button
              type="button"
              onClick={onPraise}
              disabled={praiseDisabled}
              className={`flex w-full items-center gap-3 px-5 py-4 text-left text-base font-semibold transition ${
                praiseDisabled
                  ? 'cursor-not-allowed text-slate-400'
                  : 'text-pink-600 hover:bg-pink-50'
              }`}
            >
              <Heart size={18} fill="currentColor" />
              {praiseDisabled ? praiseDisabledLabel : '칭찬하기'}
            </button>

            <div className="mx-5 h-px bg-slate-200" />

            <button
              type="button"
              onClick={onReport}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-base font-semibold text-red-600 hover:bg-red-50"
            >
              <AlertTriangle size={18} />
              신고
            </button>

            {canKick && onKick && (
              <>
                <div className="mx-5 h-px bg-slate-200" />

                <button
                  type="button"
                  onClick={onKick}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left text-base font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <UserMinus size={18} />
                  파티에서 강퇴
                </button>
              </>
            )}

            <div className="mx-5 h-px bg-slate-200" />

            <div className="flex items-center gap-3 px-5 py-4 text-left text-base font-semibold text-slate-700">
              <CreditCard size={18} className={paymentStatusTone} />

              <div className="flex min-w-0 flex-col">
                <span>결제 상태</span>
                <span className={`text-sm font-medium ${paymentStatusTone}`}>
                  {paymentStatusLabel}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ProfileInfoModal({
  user,
  onClose,
}: {
  user: ProfileDrawerUser;
  onClose: () => void;
}) {
  const trustScoreText =
    typeof user.trust_score === 'number'
      ? `${user.trust_score.toFixed(1)}점`
      : '-';

  const joinedAtText = user.joined_at
    ? new Date(user.joined_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : '-';

  const paymentStatusText =
    user.payment_status === 'completed' ? '완료' : '미완료';

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-slate-900/35 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <Avatar
              nickname={user.nickname}
              profileImage={user.profile_image}
              size="md"
            />

            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-slate-900">
                {user.nickname ?? '익명'}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                {user.role && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                )}

                {user.status && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {MEMBER_STATUS_LABEL[user.status] ?? user.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-5">
          <div className="space-y-4">
            <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
              <div className="flex shrink-0 items-center gap-2 text-slate-500">
                <ShieldCheck size={16} />
                신뢰도
              </div>

              <span className="min-w-0 wrap-break-word text-right font-semibold text-slate-900">
                {trustScoreText}
              </span>
            </div>

            <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
              <div className="flex shrink-0 items-center gap-2 text-slate-500">
                <CalendarDays size={16} />
                파티 참여일
              </div>

              <span className="min-w-0 wrap-break-word text-right font-semibold text-slate-900">
                {joinedAtText}
              </span>
            </div>

            <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
              <div className="flex shrink-0 items-center gap-2 text-slate-500">
                <CreditCard size={16} />
                이번 달 결제 상태
              </div>

              <span
                className={`min-w-0 wrap-break-word text-right font-semibold ${
                  user.payment_status === 'completed'
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                {paymentStatusText}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export function DetailRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 py-2 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>

      <span
        className={`min-w-0 wrap-break-word text-right ${
          emphasized ? 'font-bold text-primary' : 'font-semibold text-slate-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function MemberItem({
  member,
  onClick,
}: {
  member: Member;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const paymentStatusText =
    member.payment_status === 'completed' ? '결제 완료' : '결제 미완료';
  const paymentStatusClass =
    member.payment_status === 'completed'
      ? 'bg-emerald-50 text-emerald-600'
      : 'bg-amber-50 text-amber-600';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-transparent px-3 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          nickname={member.nickname}
          profileImage={member.profile_image ?? null}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">
            {displayMemberName(member) || member.nickname}
          </p>

          {displayMemberSubLabel() && (
            <p className="truncate text-xs text-slate-500">
              {displayMemberSubLabel()}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {ROLE_LABEL[member.role] ?? member.role}
            </span>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {MEMBER_STATUS_LABEL[member.status] ?? member.status}
            </span>

            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${paymentStatusClass}`}
            >
              {paymentStatusText}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
