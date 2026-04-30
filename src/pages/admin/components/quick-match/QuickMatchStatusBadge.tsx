import type {
  CandidateStatus,
  QuickMatchStatus,
} from '../../../../types/admin/adminQuickMatch.ts';

const STATUS_STYLE: Record<QuickMatchStatus, string> = {
  REQUESTED: 'border-blue-100 bg-blue-50 text-blue-700',
  MATCHED: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  FAILED: 'border-rose-100 bg-rose-50 text-rose-700',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-600',
  REMATCHING: 'border-amber-100 bg-amber-50 text-amber-700',
  CANCELLED: 'border-zinc-200 bg-zinc-50 text-zinc-600',
  TIMEOUT: 'border-orange-100 bg-orange-50 text-orange-700',
  BLOCKED: 'border-red-200 bg-red-50 text-red-700',
};

const CANDIDATE_STATUS_STYLE: Record<CandidateStatus, string> = {
  SELECTED: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  PENDING: 'border-blue-100 bg-blue-50 text-blue-700',
  REJECTED: 'border-rose-100 bg-rose-50 text-rose-700',
  FAILED: 'border-amber-100 bg-amber-50 text-amber-700',
};

const STATUS_LABEL: Record<QuickMatchStatus, string> = {
  REQUESTED: '요청됨',
  MATCHED: '매칭완료',
  FAILED: '실패',
  EXPIRED: '만료',
  REMATCHING: '재매칭중',
  CANCELLED: '취소',
  TIMEOUT: '시간초과',
  BLOCKED: '차단',
};

const CANDIDATE_STATUS_LABEL: Record<CandidateStatus, string> = {
  SELECTED: '선택',
  PENDING: '대기',
  REJECTED: '제외',
  FAILED: '가입실패',
};

export const FAILURE_REASON_LABELS: Record<string, string> = {
  NO_CANDIDATE: '조건 통과 후보 없음',
  NO_RECRUITING_PARTY: '모집중 파티 없음',
  USER_EMBEDDING_NOT_FOUND: '사용자 임베딩 없음',
  PARTY_EMBEDDING_NOT_FOUND: '파티 임베딩 없음',
  party_embedding_not_found: '파티 임베딩 없음',
  trust_score_too_low: '신뢰도 부족',
  duration_mismatch: '기간 불일치',
  category_mismatch: '카테고리 불일치',
  platform_mismatch: '플랫폼 불일치',
  party_full: '정원 초과',
  PARTY_FULL: '가입 시점 정원 초과',
  PARTY_STATUS_CHANGED: '가입 시점 파티 상태 변경',
  ALREADY_JOINED: '이미 가입된 파티',
  MAX_RETRY_EXCEEDED: '최대 재시도 초과',
  NO_MORE_CANDIDATES: '남은 후보 없음',
  CANCELLED_BY_USER: '사용자 취소',
  MATCH_TIMEOUT: '매칭 시간 초과',
  BLOCKED_USER: '제재 사용자',
};

export function labelFailureReason(value?: string | null) {
  if (!value) return '-';
  return FAILURE_REASON_LABELS[value] ?? value;
}

export function QuickMatchStatusBadge({
  status,
}: {
  status: QuickMatchStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function QuickMatchCandidateStatusBadge({
  status,
}: {
  status: CandidateStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${CANDIDATE_STATUS_STYLE[status]}`}
    >
      {CANDIDATE_STATUS_LABEL[status] ?? status}
    </span>
  );
}
