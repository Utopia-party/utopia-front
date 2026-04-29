import { useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import Pagination from './components/Pagination';
import {
  fetchAdminLogs,
  getAdminErrorMessage,
  type SystemLogRecord,
} from '../../apis/admin';

const TYPE_COLOR: Record<string, string> = {
  ERROR: 'text-red-500',
  ADMIN_ACTION: 'text-blue-500',
  USER_ACTION: 'text-emerald-600',
  SYSTEM: 'text-gray-500',
  INFO: 'text-slate-500',
  WARN: 'text-amber-600',
};

function getNormalizedActorType(log: SystemLogRecord) {
  if (
    log.actorType === 'admin' ||
    log.actorType === 'user' ||
    log.actorType === 'system'
  ) {
    return log.actorType;
  }

  if (log.type === 'USER_ACTION') {
    return 'user';
  }

  if (log.type === 'ADMIN_ACTION') {
    if (/^(GET|POST|PATCH|PUT|DELETE)\s+\/api\/admin/.test(log.message)) {
      return 'admin';
    }

    if (/(관리자|admin)/i.test(log.actor)) {
      return 'admin';
    }

    return 'user';
  }

  return 'system';
}

function getNormalizedLogType(log: SystemLogRecord) {
  const actorType = getNormalizedActorType(log);

  if (log.type === 'ADMIN_ACTION' || log.type === 'USER_ACTION') {
    return actorType === 'user' ? 'USER_ACTION' : 'ADMIN_ACTION';
  }

  return log.type;
}

const ADMIN_ROUTE_DESCRIPTIONS: Array<{
  pattern: RegExp;
  label: string;
}> = [
  { pattern: /^\/api\/admin\/services$/, label: '서비스 목록 조회' },
  {
    pattern: /^\/api\/admin\/services\/[^/]+$/,
    label: '서비스 운영 설정 수정',
  },
  { pattern: /^\/api\/admin\/users$/, label: '회원 목록 조회' },
  { pattern: /^\/api\/admin\/users\/[^/]+$/, label: '회원 상세 조회' },
  { pattern: /^\/api\/admin\/users\/[^/]+\/status$/, label: '회원 상태 변경' },
  {
    pattern: /^\/api\/admin\/users\/[^/]+\/trust-score$/,
    label: '회원 신뢰도 점수 조정',
  },
  { pattern: /^\/api\/admin\/parties$/, label: '파티 목록 조회' },
  {
    pattern: /^\/api\/admin\/parties\/[^/]+\/force-end$/,
    label: '파티 강제 종료',
  },
  {
    pattern: /^\/api\/admin\/parties\/[^/]+\/members$/,
    label: '파티 멤버 목록 조회',
  },
  {
    pattern: /^\/api\/admin\/parties\/[^/]+\/members\/[^/]+\/kick$/,
    label: '파티 멤버 강퇴',
  },
  {
    pattern: /^\/api\/admin\/parties\/[^/]+\/members\/[^/]+\/role$/,
    label: '파티 멤버 권한 변경',
  },
  {
    pattern: /^\/api\/admin\/quick-match\/requests$/,
    label: '빠른 매칭 요청 목록 조회',
  },
  {
    pattern: /^\/api\/admin\/quick-match\/policy$/,
    label: '빠른 매칭 정책 조회',
  },
  { pattern: /^\/api\/admin\/reports$/, label: '신고 목록 조회' },
  {
    pattern: /^\/api\/admin\/reports\/[^/]+\/status$/,
    label: '신고 처리 상태 변경',
  },
  {
    pattern: /^\/api\/admin\/reports\/evidences\/[^/]+\/file$/,
    label: '신고 증빙 파일 조회',
  },
  { pattern: /^\/api\/admin\/logs$/, label: '시스템 로그 조회' },
  { pattern: /^\/api\/admin\/roles$/, label: '관리자 권한 목록 조회' },
  {
    pattern: /^\/api\/admin\/roles\/[^/]+$/,
    label: '관리자 권한 설정 변경',
  },
  { pattern: /^\/api\/admin\/receipts$/, label: '영수증 목록 조회' },
  {
    pattern: /^\/api\/admin\/receipts\/[^/]+$/,
    label: '영수증 상태 변경',
  },
  { pattern: /^\/api\/admin\/settlements$/, label: '정산 목록 조회' },
  {
    pattern: /^\/api\/admin\/settlements\/[^/]+$/,
    label: '정산 상태 변경',
  },
  {
    pattern: /^\/api\/admin\/moderation\/chat-logs$/,
    label: '채팅 제재 로그 조회',
  },
  {
    pattern: /^\/api\/admin\/moderation\/chat-logs\/[^/]+\/status$/,
    label: '채팅 제재 상태 변경',
  },
];

function getAdminActionDescription(message: string) {
  const matched = message.match(
    /^(GET|POST|PATCH|PUT|DELETE)\s+([^\s]+)\s+->\s+\d{3}$/,
  );
  if (!matched) {
    return null;
  }

  const [, method, path] = matched;
  const route = ADMIN_ROUTE_DESCRIPTIONS.find(({ pattern }) =>
    pattern.test(path),
  );
  if (!route) {
    if (method === 'GET') {
      return '관리자 API 조회';
    }

    return '관리자 API 작업 요청';
  }

  if (method === 'GET') {
    return route.label;
  }

  return `${route.label} 요청`;
}

export default function AdminSystemLogs() {
  const [search, setSearch] = useState('');
  const [logType, setLogType] = useState('전체');
  const [actorType, setActorType] = useState('전체');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [logs, setLogs] = useState<SystemLogRecord[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async (params?: {
    keyword?: string;
    type?: string;
    actor_type?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    try {
      setLoading(true);
      setError('');
      setLogs(await fetchAdminLogs(params));
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const handleSearch = () => {
    void loadLogs({
      keyword: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  };

  const handleReset = () => {
    setSearch('');
    setLogType('전체');
    setActorType('전체');
    setDateFrom('');
    setDateTo('');
    void loadLogs();
  };

  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        const normalizedActorType = getNormalizedActorType(log);
        const normalizedLogType = getNormalizedLogType(log);

        if (logType !== '전체' && normalizedLogType !== logType) {
          return false;
        }

        if (actorType !== '전체' && normalizedActorType !== actorType) {
          return false;
        }

        return true;
      }),
    [actorType, logType, logs],
  );

  const handleExport = () => {
    const header = [
      'timestamp',
      'type',
      'actor_type',
      'message',
      'description',
      'actor',
    ];
    const csvRows = [
      header.join(','),
      ...filtered.map((log) =>
        [
          log.timestamp,
          log.type,
          getNormalizedActorType(log),
          log.message,
          getAdminActionDescription(log.message) ?? '',
          log.actor,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const paginatedLogs = filtered.slice((page - 1) * 20, page * 20);

  return (
    <>
      <AdminHeader
        placeholder="사용자 이름 검색"
        onSearch={setSearch}
        rightContent={
          <button
            className="px-3.5 py-1.5 border border-gray-300 rounded-md bg-white text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition"
            onClick={handleExport}
          >
            Export
          </button>
        }
      />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-1">시스템 로그</h1>
        <p className="text-sm text-gray-500 mb-4">
          에러 로깅 · 관리자 활동 로그 · 감사(Audit) 추적
        </p>

        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              사용자 이름
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="닉네임 또는 이름 검색"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 w-52"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">시작일</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">유형</span>
            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              <option value="전체">전체</option>
              <option value="ADMIN_ACTION">관리자 활동</option>
              <option value="USER_ACTION">사용자 활동</option>
              <option value="ERROR">에러</option>
              <option value="INFO">정보</option>
              <option value="WARN">경고</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">주체</span>
            <select
              value={actorType}
              onChange={(e) => setActorType(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              <option value="전체">전체</option>
              <option value="user">사용자</option>
              <option value="admin">관리자</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">종료일</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </label>
          <div className="flex gap-2 pb-0.5">
            <button
              onClick={handleSearch}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              조회
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              초기화
            </button>
          </div>
        </div>

        {loading && (
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
            시스템 로그를 불러오는 중입니다.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 shadow-sm">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  시간
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  유형
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  내용
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  주체
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3.5 text-sm whitespace-nowrap align-top">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3.5 text-sm align-top">
                    <span
                      className={`font-semibold ${TYPE_COLOR[getNormalizedLogType(log)] ?? 'text-gray-500'}`}
                    >
                      {getNormalizedLogType(log)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm align-top">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-800">{log.message}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>
                          {getNormalizedActorType(log) === 'admin'
                            ? '관리자'
                            : getNormalizedActorType(log) === 'user'
                              ? '사용자'
                              : '시스템'}
                        </span>
                        {getAdminActionDescription(log.message) && (
                          <span>{getAdminActionDescription(log.message)}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm align-top">{log.actor}</td>
                </tr>
              ))}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            total={filtered.length}
            page={page}
            pageSize={20}
            onChange={(p) => {
              setPage(p);
            }}
          />
          <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
            현재 검색 결과를 CSV로 바로 내려받을 수 있습니다.
          </div>
        </div>
      </div>
    </>
  );
}
