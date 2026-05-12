import type { Member } from '../../types/chat';

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
export const WS_BASE =
  import.meta.env.VITE_WS_BASE_URL ??
  API_BASE.replace('http://', 'ws://')
    .replace('https://', 'wss://')
    .replace('/api', '');

export const PORTONE_STORE_ID = 'store-b7fa4153-0590-4d36-9750-6c2fb830a292';
export const PORTONE_CHANNEL_KEY =
  'channel-key-ea16ef59-fabb-44d6-be05-e54d3c197582';

export const BANK_INFO = {
  bank: '신한은행',
  account: '110-612-944408',
  holder: '김성보',
};

export const ROLE_LABEL: Record<string, string> = {
  leader: '리더',
  member: '멤버',
};

export const MEMBER_STATUS_LABEL: Record<string, string> = {
  active: '정상',
  pending: '대기',
  banned: '정지',
};

export const PARTY_STATUS_LABEL: Record<string, string> = {
  recruiting: '모집중',
  full: '마감',
  active: '운영중',
  completed: '완료',
  ended: '종료',
};

export const CATEGORY_COLOR: Record<string, string> = {
  OTT: 'bg-blue-100 text-blue-700',
  '멤버십/음악': 'bg-green-100 text-green-700',
  '교육/도서': 'bg-purple-100 text-purple-700',
  생산성: 'bg-pink-100 text-pink-700',
  기타: 'bg-slate-100 text-slate-600',
};

export function getProfileInitial(nickname?: string | null) {
  if (!nickname) return '?';
  return nickname.trim().slice(0, 2).toUpperCase();
}

export function formatCurrency(value?: number | null) {
  if (value == null) return '-';
  return `${value.toLocaleString()}원`;
}

export function formatRate(value?: number | null) {
  if (value == null) return '-';
  const percent = Math.abs(value) <= 1 ? value * 100 : value;
  return `${percent}%`;
}

export function displayMemberName(member: Member) {
  return member.nickname?.trim() || member.name?.trim() || '';
}

export function displayMemberSubLabel() {
  return '';
}
