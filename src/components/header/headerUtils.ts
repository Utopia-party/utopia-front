import type { NotificationItem } from '../../types/notifications';

export function formatRelativeTime(dateString: string | null) {
  if (!dateString) return '';
  const now = new Date();
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return '';
  const diffMs = now.getTime() - target.getTime();
  if (diffMs < 60 * 1000) return '방금 전';
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days}일 전`;
  return target.toLocaleDateString('ko-KR');
}

export function getNotificationBadge(item: NotificationItem) {
  const refType = item.reference_type?.toLowerCase();
  const type = item.type?.toLowerCase();
  if (refType === 'report' || type === 'report')
    return {
      label: '신고',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  if (
    refType === 'settlement' ||
    refType === 'payment' ||
    type === 'settlement' ||
    type === 'payment'
  )
    return {
      label: '결제',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  if (refType === 'party' || type?.includes('party'))
    return {
      label: '파티',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    };
  if (refType === 'user_praise' || type === 'praise')
    return {
      label: '칭찬',
      className: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    };
  return {
    label: '알림',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  };
}

export function getNotificationTargetPath(item: NotificationItem) {
  const refType = item.reference_type?.toLowerCase();
  const type = item.type?.toLowerCase();
  if (refType === 'report' || type === 'report') return '/mypage/report';
  if (
    refType === 'settlement' ||
    refType === 'payment' ||
    type === 'settlement' ||
    type === 'payment'
  )
    return '/mypage/payment';
  if (refType === 'party' || type?.includes('party')) return '/mypage/party';
  if (refType === 'user_praise' || type === 'praise') return '/mypage/praises';
  return null;
}

export function getProfileInitial(nickname?: string | null) {
  if (!nickname) return 'PU';
  return nickname.trim().slice(0, 2).toUpperCase();
}

export function formatTrustScore(score?: number | null) {
  if (score === null || score === undefined) return null;
  return `${score}점`;
}

export function formatSessionTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
