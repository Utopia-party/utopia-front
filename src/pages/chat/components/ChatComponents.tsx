import { useState } from 'react';
import { User, AlertTriangle } from 'lucide-react';
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
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';

  const content =
    profileImage && !imgError ? (
      <img
        src={profileImage}
        alt={nickname ?? 'profile'}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
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
        className={`${sizeClass} rounded-full bg-primary text-white font-extrabold flex items-center justify-center overflow-hidden shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary text-white font-extrabold flex items-center justify-center overflow-hidden shrink-0`}
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
}: {
  user: ProfileDrawerUser;
  top: number;
  left: number;
  isMe: boolean;
  onClose: () => void;
  onProfileInfo: () => void;
  onReport: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70]" onClick={onClose}>
      <div
        className="absolute w-[280px] overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
        style={{ top, left }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Avatar
              nickname={user.nickname}
              profileImage={user.profile_image}
              size="md"
            />
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 truncate">
                {user.nickname ?? '익명'}
              </p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
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
              onClick={onReport}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-base font-semibold text-red-600 hover:bg-red-50"
            >
              <AlertTriangle size={18} />
              신고
            </button>
          </>
        )}
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
    <div className="flex items-start justify-between gap-3 py-2 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span
        className={`text-right ${
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
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-transparent px-3 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50"
    >
      <div className="flex items-center gap-3">
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
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {ROLE_LABEL[member.role] ?? member.role}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {MEMBER_STATUS_LABEL[member.status] ?? member.status}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
