import { useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

type TrustHistoryItem = {
  id: number;
  title: string;
  date: string;
  detail: string;
  score: number;
};

const historyData: TrustHistoryItem[] = [
  {
    id: 1,
    title: '정산 승인 완료',
    date: '2026-03-01',
    detail: '파티: 스터디룸 공유',
    score: 3,
  },
  {
    id: 2,
    title: '참여 후기 작성',
    date: '2026-02-24',
    detail: '파티: 전주 맛집 투어',
    score: 2,
  },
  {
    id: 3,
    title: '신고 접수(검토중)',
    date: '2026-02-26',
    detail: '사유: 노쇼/약속 불이행',
    score: -5,
  },
  {
    id: 4,
    title: '이상 활동 없음',
    date: '2026-02-01',
    detail: '시스템 점검',
    score: 0,
  },
];

const baseCumulativeGraphData = [
  { label: '02/01', value: 82 },
  { label: '02/24', value: 84 },
  { label: '02/26', value: 79 },
  { label: '03/01', value: 82 },
];

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
      <g key={item.label}>
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
        key={item.label}
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
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[220px] w-full min-w-[760px]"
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
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${month}/${day}`;
}

export default function MyTrustHistory() {
  const { user } = useAuthStore();
  const [category, setCategory] = useState('전체');
  const [period, setPeriod] = useState('최근 3개월');
  const [keyword, setKeyword] = useState('');

  const currentTrustScore = user?.trust_score;

  console.log(user?.updated_at);
  const cumulativeGraphData = useMemo(() => {
    if (currentTrustScore === null || currentTrustScore === undefined) {
      return baseCumulativeGraphData;
    }

    return baseCumulativeGraphData.map((item, index, array) => {
      if (index === array.length - 1) {
        return {
          label: formatDateToMMDD(user?.updated_at),
          value: currentTrustScore,
        };
      }
      return item;
    });
  }, [currentTrustScore, user?.updated_at]);

  const filteredHistory = useMemo(() => {
    return historyData.filter((item) => {
      const matchesKeyword =
        keyword.trim() === '' ||
        item.title.includes(keyword) ||
        item.detail.includes(keyword);

      if (category === '전체') return matchesKeyword;
      if (category === '증가') return item.score > 0 && matchesKeyword;
      if (category === '감소') return item.score < 0 && matchesKeyword;
      if (category === '유지') return item.score === 0 && matchesKeyword;

      return matchesKeyword;
    });
  }, [category, keyword]);

  return (
    <div className="min-h-full bg-[#f5f7fb] px-10 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
            마이페이지 - 신뢰도 변화 이력
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            내 신뢰도 변화 이력
          </p>
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  신뢰도 변화 그래프
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  최근 기간 동안의 누적 신뢰도 흐름입니다.
                </p>
              </div>

              <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-primary">
                현재 신뢰도 {formatTrustScore(currentTrustScore)}
              </div>
            </div>

            <TrustScoreLineChart data={cumulativeGraphData} />
          </div>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 outline-none"
              >
                <option>전체</option>
                <option>증가</option>
                <option>감소</option>
                <option>유지</option>
              </select>

              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 outline-none"
              >
                <option>최근 1개월</option>
                <option>최근 3개월</option>
                <option>최근 6개월</option>
              </select>
            </div>

            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="사유/파티명 검색"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 md:w-[250px]"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {filteredHistory.map((item) => (
              <article
                key={item.id}
                className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/60 px-5 py-5"
              >
                <div>
                  <p className="text-[15px] font-extrabold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {item.date} · {item.detail}
                  </p>
                </div>

                <div
                  className={`inline-flex min-w-[118px] items-center justify-center rounded-full px-7 py-3 text-[18px] font-extrabold ${getScoreBadgeClass(
                    item.score,
                  )}`}
                >
                  {getScoreText(item.score)}
                </div>
              </article>
            ))}

            {filteredHistory.length === 0 && (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/60 px-5 py-10 text-center text-sm font-semibold text-slate-500">
                검색 조건에 맞는 신뢰도 변화 이력이 없습니다.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
