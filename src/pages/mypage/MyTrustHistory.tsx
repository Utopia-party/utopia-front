import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getMyTrustHistory } from '../../apis/user';
import type { TrustHistoryApiItem } from '../../types/user';

type TrustHistoryItem = {
  id: number | string;
  title: string;
  date: string;
  detail: string;
  score: number;
  trustScoreAfter?: number | null;
  createdAt: string;
};

type CategoryFilter = '전체' | '점수 상승' | '점수 하락';
type PeriodFilter = '최근 1개월' | '최근 3개월' | '최근 6개월';

const ITEMS_PER_PAGE = 10;

function getScoreBadgeClass(score: number) {
  if (score > 0) {
    return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (score < 0) {
    return 'border border-rose-200 bg-rose-50 text-rose-700';
  }
  return 'border border-slate-200 bg-slate-50 text-slate-600';
}

function getScoreText(score: number) {
  if (score > 0) return `+${score}`;
  return `${score}`;
}

function formatTrustScore(score?: number | null) {
  if (score === null || score === undefined) return '-';
  return `${score}점`;
}

function TrustScoreLineChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const width = 760;
  const height = 220;
  const padding = 28;

  if (data.length === 0) {
    return (
      <div className="flex h-55 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm font-semibold text-slate-400 break-keep">
        그래프로 표시할 신뢰도 변화 데이터가 없습니다.
      </div>
    );
  }

  const minValue = Math.min(...data.map((item) => item.value)) - 2;
  const maxValue = Math.max(...data.map((item) => item.value)) + 2;
  const range = maxValue - minValue || 1;

  const points = data
    .map((item, index) => {
      const x =
        padding +
        (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
      const y =
        height - padding - ((item.value - minValue) / range) * (height - 56);
      return `${x},${y}`;
    })
    .join(' ');

  const circles = data.map((item, index) => {
    const x =
      padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y =
      height - padding - ((item.value - minValue) / range) * (height - 56);

    return (
      <g key={`${item.label}-${index}`}>
        <circle cx={x} cy={y} r="5" fill="#2563eb" />
        <circle cx={x} cy={y} r="10" fill="#2563eb" fillOpacity="0.12" />
        <text
          x={x}
          y={y - 14}
          textAnchor="middle"
          fontSize="11"
          fill="#334155"
          fontWeight="700"
        >
          {item.value}
        </text>
      </g>
    );
  });

  const xLabels = data.map((item, index) => {
    const x =
      padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);

    return (
      <text
        key={`${item.label}-${index}`}
        x={x}
        y={height - 6}
        textAnchor="middle"
        fontSize="11"
        fill="#64748b"
        fontWeight="600"
      >
        {item.label}
      </text>
    );
  });

  const gridLines = [0, 1, 2, 3].map((row) => {
    const y = padding + (row * (height - 56)) / 3;
    return (
      <line
        key={row}
        x1={padding}
        y1={y}
        x2={width - padding}
        y2={y}
        stroke="#e2e8f0"
        strokeDasharray="4 4"
      />
    );
  });

  return (
    // 💡 모바일 가로 스크롤 허용 & 못생긴 브라우저 기본 스크롤바 숨김 처리
    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-55 w-full min-w-190"
        role="img"
        aria-label="신뢰도 변화 그래프"
      >
        {gridLines}
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
        {circles}
        {xLabels}
      </svg>
    </div>
  );
}

function formatDateToMMDD(dateString?: string) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${month}/${day}`;
}

function formatDate(dateString?: string) {
  if (!dateString) return '-';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('ko-KR');
}

function matchesPeriod(dateString: string, period: PeriodFilter) {
  const baseDate = new Date(dateString);
  if (Number.isNaN(baseDate.getTime())) return false;

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  const targetDay = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    0,
    0,
    0,
    0,
  );

  const startDate = new Date(today);

  if (period === '최근 1개월') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (period === '최근 3개월') {
    startDate.setMonth(startDate.getMonth() - 3);
  } else {
    startDate.setMonth(startDate.getMonth() - 6);
  }

  startDate.setHours(0, 0, 0, 0);

  return targetDay >= startDate && targetDay <= today;
}

function mapTrustHistoryItem(item: TrustHistoryApiItem): TrustHistoryItem {
  return {
    id: item.id,
    title: item.title,
    date: formatDate(item.created_at),
    detail: item.detail,
    score: item.score_change,
    trustScoreAfter: item.trust_score_after,
    createdAt: item.created_at,
  };
}

export default function MyTrustHistory() {
  usePageTitle('신뢰도 변화');

  const { user } = useAuthStore();
  const [category, setCategory] = useState<CategoryFilter>('전체');
  const [period, setPeriod] = useState<PeriodFilter>('최근 1개월');
  const [keyword, setKeyword] = useState('');
  const [historyData, setHistoryData] = useState<TrustHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const currentTrustScore = user?.trust_score;

  useEffect(() => {
    let mounted = true;

    const fetchTrustHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getMyTrustHistory();

        if (!mounted) return;

        const normalizedItems = (res.items ?? [])
          .map(mapTrustHistoryItem)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

        setHistoryData(normalizedItems);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError('신뢰도 변화 이력을 불러오지 못했습니다.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchTrustHistory();

    return () => {
      mounted = false;
    };
  }, []);

  const cumulativeGraphData = useMemo(() => {
    return historyData
      .filter((item) => matchesPeriod(item.createdAt, period))
      .filter(
        (item) =>
          item.trustScoreAfter !== null && item.trustScoreAfter !== undefined,
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((item) => ({
        label: formatDateToMMDD(item.createdAt),
        value: item.trustScoreAfter as number,
      }));
  }, [historyData, period]);

  const filteredHistory = useMemo(() => {
    const trimmedKeyword = keyword.trim();

    return historyData.filter((item) => {
      const matchesKeyword =
        trimmedKeyword === '' ||
        item.title.includes(trimmedKeyword) ||
        item.detail.includes(trimmedKeyword);

      if (!matchesKeyword) return false;

      const matchesSelectedPeriod = matchesPeriod(item.createdAt, period);
      if (!matchesSelectedPeriod) return false;

      if (category === '전체') return true;
      if (category === '점수 상승') return item.score > 0;
      if (category === '점수 하락') return item.score < 0;

      return true;
    });
  }, [category, historyData, keyword, period]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / ITEMS_PER_PAGE),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedHistory = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHistory, safeCurrentPage]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    // 💡 최외곽 여백 모바일 최적화 (px-10 -> px-4 sm:px-6 md:px-10)
    <div className="min-h-full bg-[#f5f7fb] px-4 py-6 sm:px-6 sm:py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 sm:mb-7">
          <h1 className="text-xl sm:text-[24px] font-extrabold tracking-tight text-slate-900 break-keep">
            마이페이지 - 신뢰도 변화 이력
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            내 신뢰도 변화 이력
          </p>
        </div>

        <section className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          {/* 상단 그래프 영역 */}
          <div className="rounded-xl sm:rounded-3xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            {/* 💡 모바일에서는 타이틀과 '현재 신뢰도' 뱃지가 좁아서 세로로 배치되도록 수정 */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  신뢰도 변화 그래프
                </h2>
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-slate-500">
                  {period} 기준 신뢰도 변화 흐름입니다.
                </p>
              </div>

              <div className="inline-flex self-start sm:self-auto rounded-full bg-blue-50 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-extrabold text-primary">
                현재 신뢰도 {formatTrustScore(currentTrustScore)}
              </div>
            </div>

            <TrustScoreLineChart data={cumulativeGraphData} />
          </div>

          {/* 중간 필터 및 검색 영역 */}
          <div className="mt-5 sm:mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* 💡 모바일에서 두 Select 박스가 동일한 너비(flex-1)를 차지하도록 조절 */}
            <div className="flex w-full sm:w-auto gap-2">
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as CategoryFilter);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto h-11 sm:min-w-33 appearance-none rounded-xl sm:rounded-full border border-slate-200 bg-slate-50 px-4 pr-10 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-white focus:border-primary focus:bg-white"
                >
                  <option>전체</option>
                  <option>점수 상승</option>
                  <option>점수 하락</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>

              <div className="relative flex-1 sm:flex-none">
                <select
                  value={period}
                  onChange={(e) => {
                    setPeriod(e.target.value as PeriodFilter);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto h-11 sm:min-w-33 appearance-none rounded-xl sm:rounded-full border border-slate-200 bg-slate-50 px-4 pr-10 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-white focus:border-primary focus:bg-white"
                >
                  <option>최근 1개월</option>
                  <option>최근 3개월</option>
                  <option>최근 6개월</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="사유/파티명 검색"
              // 모바일 높이 통일 및 글꼴 크기 조정
              className="w-full h-11 rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 md:w-62.5"
            />
          </div>

          {/* 리스트 영역 */}
          <div className="mt-4 flex flex-col gap-3">
            {loading && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/60 px-5 py-10 text-center text-sm font-semibold text-slate-500">
                신뢰도 변화 이력을 불러오는 중입니다.
              </div>
            )}

            {!loading && error && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-10 text-center text-sm font-semibold text-rose-600">
                {error}
              </div>
            )}

            {!loading &&
              !error &&
              pagedHistory.map((item) => (
                <article
                  key={item.id}
                  // 💡 모바일에서는 뱃지가 너무 크면 텍스트를 밀어내므로 갭과 크기를 반응형으로 조정
                  className="flex items-center justify-between gap-3 rounded-2xl sm:rounded-3xl border border-slate-200 bg-slate-50/60 p-4 sm:px-5 sm:py-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm sm:text-[15px] font-extrabold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-1 truncate text-xs sm:text-sm font-semibold text-slate-500">
                      {item.date} · {item.detail}
                    </p>
                  </div>

                  <div
                    className={`inline-flex shrink-0 min-w-17.5 sm:min-w-29.5 items-center justify-center rounded-xl sm:rounded-full px-3 py-2 sm:px-7 sm:py-3 text-sm sm:text-[18px] font-extrabold ${getScoreBadgeClass(
                      item.score,
                    )}`}
                  >
                    {getScoreText(item.score)}
                  </div>
                </article>
              ))}

            {!loading && !error && filteredHistory.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/60 px-5 py-10 text-center text-sm font-semibold text-slate-500">
                검색 조건에 맞는 신뢰도 변화 이력이 없습니다.
              </div>
            )}
          </div>

          {/* 페이지네이션 */}
          {!loading && !error && filteredHistory.length > 0 && (
            // 💡 페이지가 많을 경우 대비 flex-wrap 추가
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                className="h-9 sm:h-11 rounded-lg sm:rounded-full border border-slate-200 bg-white px-3 sm:px-4 text-xs sm:text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setCurrentPage(Math.max(safeCurrentPage - 1, 1))}
                disabled={safeCurrentPage === 1}
              >
                이전
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={[
                    'h-9 sm:h-11 min-w-9 sm:min-w-11 rounded-lg sm:rounded-full px-3 sm:px-4 text-xs sm:text-sm font-extrabold transition',
                    safeCurrentPage === page
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
                className="h-9 sm:h-11 rounded-lg sm:rounded-full border border-slate-200 bg-white px-3 sm:px-4 text-xs sm:text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() =>
                  setCurrentPage(Math.min(safeCurrentPage + 1, totalPages))
                }
                disabled={safeCurrentPage === totalPages}
              >
                다음
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
