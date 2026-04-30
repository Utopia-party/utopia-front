import type { QuickMatchRequestRow } from '../../../../types/admin/adminQuickMatch.ts';
import {
  labelFailureReason,
  QuickMatchCandidateStatusBadge,
  QuickMatchStatusBadge,
} from './QuickMatchStatusBadge';

function formatSeconds(value?: number | null) {
  if (value == null) return '-';
  return `${value.toFixed(2)}초`;
}

function formatMs(value?: number | null) {
  if (value == null) return '-';
  return `${value.toLocaleString()}ms`;
}

function formatOptional(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
}

function confirmRun(message: string, action: () => void) {
  if (window.confirm(message)) action();
}

export function QuickMatchRequestDetail({
  selected,
  actionLoading,
  onRetry,
  onForceFail,
  onRegenerateUserEmbedding,
  onRegeneratePartyEmbedding,
}: {
  selected: QuickMatchRequestRow | null;
  actionLoading: string | null;
  onRetry: (requestId: string) => void;
  onForceFail: (requestId: string) => void;
  onRegenerateUserEmbedding: (userId: string) => void;
  onRegeneratePartyEmbedding: (partyId: string) => void;
}) {
  if (!selected) {
    return (
      <div className="p-8 text-center text-sm text-slate-400">
        선택된 요청이 없습니다.
      </div>
    );
  }

  const rejectedCount = selected.candidates.filter(
    (candidate) => candidate.status === 'REJECTED',
  ).length;
  const failedCandidates = selected.candidates.filter(
    (candidate) => candidate.status === 'FAILED',
  );
  const canRetry =
    selected.status === 'FAILED' ||
    selected.status === 'EXPIRED' ||
    selected.status === 'TIMEOUT';
  const canForceFail =
    selected.status === 'REQUESTED' || selected.status === 'REMATCHING';
  const selectedPartyId =
    selected.matchedPartyId ??
    selected.candidates.find((candidate) => candidate.status === 'SELECTED')
      ?.partyId;

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            요청 상세
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {selected.requestId}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {selected.userNickname} · {selected.serviceName} ·{' '}
            {selected.requestedAt}
          </p>
        </div>
        <QuickMatchStatusBadge status={selected.status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ['최종 결과', formatOptional(selected.matchedPartyName)],
          ['실패 사유', labelFailureReason(selected.failReason)],
          ['후보 수', `${selected.candidates.length}개`],
          ['제외 후보 수', `${rejectedCount}개`],
          ['가입 실패 후보', `${failedCandidates.length}개`],
          ['총 소요 시간', formatSeconds(selected.totalMatchSeconds)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="text-xs font-medium text-slate-400">{label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900">
          단계별 소요 시간
        </h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            ['요청 검증', selected.stepTimings.validationMs],
            ['프로필/임베딩', selected.stepTimings.profileEmbeddingMs],
            ['하드 필터링', selected.stepTimings.hardFilterMs],
            ['Rule 점수', selected.stepTimings.ruleScoringMs],
            ['Vector 점수', selected.stepTimings.vectorScoringMs],
            ['join_party()', selected.stepTimings.joinPartyMs],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
            >
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {label}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-800">
                {formatMs(Number(value))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900">
          사용자 프로필 스냅샷
        </h3>
        <div className="mt-3 grid gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium text-slate-400">요청 조건</div>
            <div className="mt-1 text-sm text-slate-700">
              카테고리{' '}
              {formatOptional(
                selected.aiProfileSnapshot.preferredConditions.category,
              )}{' '}
              · 플랫폼{' '}
              {formatOptional(
                selected.aiProfileSnapshot.preferredConditions.platform,
              )}{' '}
              · 선호기간{' '}
              {formatOptional(
                selected.aiProfileSnapshot.preferredConditions
                  .durationPreference,
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-medium text-slate-400">
                활동 요약
              </div>
              <div className="mt-1 text-sm text-slate-700">
                총{' '}
                {selected.aiProfileSnapshot.activitySummary.totalPartyJoinCount}
                회 · 서비스{' '}
                {
                  selected.aiProfileSnapshot.activitySummary
                    .servicePartyJoinCount
                }
                회 · 활성{' '}
                {selected.aiProfileSnapshot.activitySummary.activePartyCount}개
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-medium text-slate-400">
                리스크 / 신뢰도
              </div>
              <div className="mt-1 text-sm text-slate-700">
                신뢰도 {selected.aiProfileSnapshot.trustScore.toFixed(1)} · 신고{' '}
                {selected.aiProfileSnapshot.riskSummary.reportCount}회 · 이탈{' '}
                {selected.aiProfileSnapshot.riskSummary.leaveCount}회 · 정산
                성공{' '}
                {
                  selected.aiProfileSnapshot.paymentSummary
                    .settlementSuccessCount
                }
                회
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            후보 / 결과 상세
          </h3>
          <div className="text-xs text-slate-400">rule / vector / final</div>
        </div>

        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {selected.candidates.map((candidate) => (
            <div
              key={candidate.candidateId}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    #{candidate.rank ?? '-'} {candidate.partyName}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {candidate.partyId}
                  </div>
                </div>
                <QuickMatchCandidateStatusBadge status={candidate.status} />
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Score label="Rule" value={candidate.ruleScore} />
                <Score label="Vector" value={candidate.vectorScore} />
                <Score label="Final" value={candidate.finalScore} />
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                <div>
                  제외 사유:{' '}
                  {formatOptional(candidate.filterReasons.excluded_reason)}
                </div>
                <div>
                  가입 실패:{' '}
                  {labelFailureReason(
                    candidate.filterReasons.join_failure_reason,
                  )}
                </div>
                <div>
                  매칭 방식:{' '}
                  {formatOptional(candidate.filterReasons.match_mode)}
                </div>
              </div>
            </div>
          ))}

          {selected.candidates.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
              후보 기록이 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">운영 액션</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          상태에 맞는 액션만 노출합니다. 실행 전 확인창을 띄워 실수 처리를
          줄입니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {canRetry && (
            <button
              disabled={actionLoading !== null}
              onClick={() =>
                confirmRun('이 실패 요청을 재시도하시겠습니까?', () =>
                  onRetry(selected.requestId),
                )
              }
              className="rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              실패 요청 재시도
            </button>
          )}
          <button
            disabled={actionLoading !== null}
            onClick={() =>
              confirmRun(
                '이 사용자의 빠른매칭 임베딩을 재생성하시겠습니까?',
                () => onRegenerateUserEmbedding(selected.userId),
              )
            }
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            사용자 임베딩 재생성
          </button>
          <button
            disabled={actionLoading !== null || !selectedPartyId}
            onClick={() =>
              selectedPartyId &&
              confirmRun(
                '이 파티의 빠른매칭 임베딩을 재생성하시겠습니까?',
                () => onRegeneratePartyEmbedding(selectedPartyId),
              )
            }
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            파티 임베딩 재생성
          </button>
          {canForceFail && (
            <button
              disabled={actionLoading !== null}
              onClick={() =>
                confirmRun('진행 중인 요청을 강제 실패 처리하시겠습니까?', () =>
                  onForceFail(selected.requestId),
                )
              }
              className="rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              요청 강제 실패
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-medium text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800">
        {value.toFixed(3)}
      </div>
    </div>
  );
}
