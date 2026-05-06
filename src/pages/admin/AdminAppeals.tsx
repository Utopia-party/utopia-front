import { useEffect, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import {
  fetchAdminAppeals,
  reviewAppeal,
  type AdminAppealOut,
} from '../../apis/admin/adminAppeals';

const FILTER_TABS = ['전체', 'PENDING', 'APPROVED', 'REJECTED'];

const STATUS_LABEL: Record<string, string> = {
  PENDING: '검토 대기',
  APPROVED: '승인',
  REJECTED: '거부',
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  APPROVED: 'text-green-600 bg-green-50',
  REJECTED: 'text-red-500 bg-red-50',
};

const BAN_TYPE_LABEL: Record<string, string> = {
  ip_ban: 'IP 차단',
  trust_score: '신뢰도 점수',
  manual: '수동 제재',
};

const fmt = (v?: string | null) => {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminAppeals() {
  const [appeals, setAppeals] = useState<AdminAppealOut[]>([]);
  const [tab, setTab] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // 처리 모달 상태
  const [reviewing, setReviewing] = useState<AdminAppealOut | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>(
    'APPROVED',
  );
  const [adminMemo, setAdminMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const statusParam = tab === '전체' ? '' : tab;
      const data = await fetchAdminAppeals(statusParam);
      setAppeals(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const handleReview = async () => {
    if (!reviewing) return;
    setIsSubmitting(true);
    setError('');
    try {
      const updated = await reviewAppeal(reviewing.id, {
        status: reviewStatus,
        admin_memo: adminMemo.trim() || undefined,
      });
      setAppeals((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      );
      setReviewing(null);
      setAdminMemo('');
    } catch (e: any) {
      setError(e?.response?.data?.detail || '처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = appeals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <AdminHeader placeholder="이의제기 검색..." />

      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          검토 대기 중인 이의제기가{' '}
          <span className="font-bold">{pendingCount}건</span> 있습니다.
        </div>
      )}

      <FilterTabs tabs={FILTER_TABS} activeTab={tab} onTabChange={setTab} />

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">
          불러오는 중...
        </div>
      ) : appeals.length === 0 ? (
        <div className="py-20 text-center text-sm text-gray-400">
          이의제기 내역이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {appeals.map((appeal) => (
            <div
              key={appeal.id}
              className="rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              {/* 헤더 행 */}
              <button
                type="button"
                onClick={() =>
                  setExpanded(expanded === appeal.id ? null : appeal.id)
                }
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">
                      {appeal.user_nickname}
                    </span>
                    <span className="text-xs text-gray-400">
                      {appeal.user_email}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {BAN_TYPE_LABEL[appeal.ban_type] ?? appeal.ban_type}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {appeal.reason}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[appeal.status] ?? ''}`}
                  >
                    {STATUS_LABEL[appeal.status] ?? appeal.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {fmt(appeal.created_at)}
                  </span>
                </div>
              </button>

              {/* 상세 펼치기 */}
              {expanded === appeal.id && (
                <div className="border-t border-gray-100 px-5 py-4 text-sm">
                  {/* 제재 기록 */}
                  <div className="mb-3 rounded-lg bg-gray-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      제재 기록
                    </p>
                    {appeal.ban_detail ? (
                      <>
                        <p className="text-gray-700">{appeal.ban_detail}</p>
                        {appeal.ban_score_change !== null && (
                          <p className="mt-1 text-xs text-red-500">
                            신뢰도 변동:{' '}
                            {appeal.ban_score_change > 0 ? '+' : ''}
                            {appeal.ban_score_change}점
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          제재 일시: {fmt(appeal.ban_created_at)}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-400">제재 상세 기록 없음</p>
                    )}
                  </div>

                  {/* 이의제기 사유 */}
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      이의제기 사유
                    </p>
                    <p className="whitespace-pre-wrap text-gray-700">
                      {appeal.reason}
                    </p>
                  </div>

                  {/* 처리 결과 */}
                  {appeal.status !== 'PENDING' && (
                    <div className="mb-3 rounded-lg bg-gray-50 p-3">
                      <p className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        처리 결과
                      </p>
                      <p className="text-gray-700">
                        {STATUS_LABEL[appeal.status]} —{' '}
                        {appeal.reviewed_by_nickname ?? '-'}
                      </p>
                      {appeal.admin_memo && (
                        <p className="mt-1 text-xs text-gray-500">
                          {appeal.admin_memo}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        {fmt(appeal.reviewed_at)}
                      </p>
                    </div>
                  )}

                  {/* 처리 버튼 */}
                  {appeal.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewing(appeal);
                        setReviewStatus('APPROVED');
                        setAdminMemo('');
                        setError('');
                      }}
                      className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      처리하기
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 처리 모달 */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              이의제기 처리
            </h3>
            <p className="mb-3 text-sm text-gray-500">
              <span className="font-semibold text-gray-700">
                {reviewing.user_nickname}
              </span>{' '}
              님의 이의제기
            </p>

            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setReviewStatus('APPROVED')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
                  reviewStatus === 'APPROVED'
                    ? 'bg-green-500 text-white'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                승인 (제재 해제)
              </button>
              <button
                type="button"
                onClick={() => setReviewStatus('REJECTED')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
                  reviewStatus === 'REJECTED'
                    ? 'bg-red-500 text-white'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                거부
              </button>
            </div>

            <textarea
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              placeholder="관리자 메모 (선택사항)"
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />

            {reviewStatus === 'APPROVED' &&
              reviewing.ban_score_change !== null && (
                <p className="mt-2 text-xs text-green-600">
                  승인 시 신뢰도 점수 {Math.abs(reviewing.ban_score_change)}점
                  복구됩니다.
                </p>
              )}

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setReviewing(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleReview}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
