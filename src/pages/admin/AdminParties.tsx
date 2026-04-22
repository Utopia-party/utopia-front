import { Fragment, useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import Pagination from './components/Pagination';
import {
  changeAdminPartyMemberRole,
  fetchAdminParties,
  fetchAdminPartyMembers,
  forceEndAdminParty,
  getAdminErrorMessage,
  kickAdminPartyMember,
  type AdminPartyMember,
  type AdminPartyRecord,
} from '../../apis/admin';

const STATUS_STYLE: Record<string, string> = {
  운영중: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  모집중: 'bg-blue-50 text-blue-600 border-blue-100',
  위험: 'bg-amber-50 text-amber-600 border-amber-100',
  종료됨: 'bg-red-50 text-red-600 border-red-100',
};

const FILTER_TABS = ['전체', '운영중', '모집중', '위험', '종료됨'];

const formatWon = (amount: number) => `₩ ${amount.toLocaleString()}`;

export default function AdminParties() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [category, setCategory] = useState('전체');
  const [parties, setParties] = useState<AdminPartyRecord[]>([]);
  const [expandedPartyId, setExpandedPartyId] = useState<string | null>(null);
  const [forceEndPartyId, setForceEndPartyId] = useState<string | null>(null);
  const [forceEndReason, setForceEndReason] = useState('운영 정책 위반');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyPartyId, setBusyPartyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // 멤버 관리 상태
  const [memberPanelPartyId, setMemberPanelPartyId] = useState<string | null>(
    null,
  );
  const [membersMap, setMembersMap] = useState<
    Record<string, AdminPartyMember[]>
  >({});
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [kickConfirmId, setKickConfirmId] = useState<string | null>(null);
  const [kickReason, setKickReason] = useState('');

  useEffect(() => {
    let alive = true;

    const loadParties = async () => {
      try {
        setLoading(true);
        setError('');
        const nextParties = await fetchAdminParties();
        if (alive) {
          setParties(nextParties);
        }
      } catch (err) {
        if (alive) {
          setError(getAdminErrorMessage(err));
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void loadParties();
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(
    () => [
      '전체',
      ...Array.from(new Set(parties.map((party) => party.category))),
    ],
    [parties],
  );

  const buildPartyParams = (status = activeTab, categoryValue = category) => ({
    keyword: search || undefined,
    status: status !== '전체' ? status : undefined,
    category: categoryValue !== '전체' ? categoryValue : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const reloadParties = async () => {
    setLoading(true);
    setError('');
    try {
      setParties(await fetchAdminParties(buildPartyParams()));
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (status = activeTab, categoryValue = category) => {
    setLoading(true);
    setError('');
    try {
      setParties(
        await fetchAdminParties(buildPartyParams(status, categoryValue)),
      );
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setCategory('전체');
    setActiveTab('전체');
    setLoading(true);
    setError('');
    try {
      setParties(await fetchAdminParties());
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (partyId: string) => {
    setExpandedPartyId((prev) => (prev === partyId ? null : partyId));
    setForceEndPartyId((prev) => (prev === partyId ? prev : null));
  };

  const openForceEndEditor = (party: AdminPartyRecord) => {
    setExpandedPartyId(party.id);
    setForceEndPartyId(party.id);
    setForceEndReason('운영 정책 위반');
  };

  const handleForceEnd = async (party: AdminPartyRecord) => {
    try {
      setBusyPartyId(party.id);
      await forceEndAdminParty(party.id, forceEndReason.trim() || undefined);
      await reloadParties();
      setForceEndPartyId(null);
      setForceEndReason('운영 정책 위반');
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setBusyPartyId(null);
    }
  };

  const openMemberPanel = async (partyId: string) => {
    if (memberPanelPartyId === partyId) {
      setMemberPanelPartyId(null);
      return;
    }
    setMemberPanelPartyId(partyId);
    setExpandedPartyId(partyId);
    setMemberError('');
    if (membersMap[partyId]) return;
    try {
      setMemberLoading(true);
      const members = await fetchAdminPartyMembers(partyId);
      setMembersMap((prev) => ({ ...prev, [partyId]: members }));
    } catch (err) {
      setMemberError(getAdminErrorMessage(err));
    } finally {
      setMemberLoading(false);
    }
  };

  const reloadMembers = async (partyId: string) => {
    try {
      setMemberLoading(true);
      const members = await fetchAdminPartyMembers(partyId);
      setMembersMap((prev) => ({ ...prev, [partyId]: members }));
    } catch (err) {
      setMemberError(getAdminErrorMessage(err));
    } finally {
      setMemberLoading(false);
    }
  };

  const handleKickMember = async (partyId: string, memberId: string) => {
    try {
      setBusyMemberId(memberId);
      await kickAdminPartyMember(
        partyId,
        memberId,
        kickReason.trim() || undefined,
      );
      await reloadMembers(partyId);
      setKickConfirmId(null);
      setKickReason('');
    } catch (err) {
      setMemberError(getAdminErrorMessage(err));
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleChangeRole = async (
    partyId: string,
    userId: string,
    newRole: 'leader' | 'member',
  ) => {
    try {
      setBusyMemberId(userId);
      await changeAdminPartyMemberRole(partyId, userId, newRole);
      await reloadMembers(partyId);
    } catch (err) {
      setMemberError(getAdminErrorMessage(err));
    } finally {
      setBusyMemberId(null);
    }
  };

  const filtered = useMemo(() => parties, [parties]);
  const paginated = filtered.slice((page - 1) * 20, page * 20);

  const summary = useMemo(
    () => [
      { label: '전체 파티', value: `${parties.length}` },
      {
        label: '운영중',
        value: `${parties.filter((party) => party.status === '운영중').length}`,
      },
      {
        label: '위험',
        value: `${parties.filter((party) => party.status === '위험').length}`,
      },
      {
        // 파티 종료 수정
        label: '종료됨',
        value: `${parties.filter((party) => party.status === '종료됨').length}`,
        // 파티 종료 수정
      },
    ],
    [parties],
  );

  return (
    <>
      <AdminHeader
        placeholder="파티 검색 (파티명/서비스/리더)..."
        onSearch={setSearch}
      />
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section>
            <h1 className="text-2xl font-bold text-gray-900">파티관리</h1>
            <p className="mt-1 text-sm text-gray-500">
              파티 운영 상태, 신고 누적, 최근 정산 이슈를 한 화면에서 관리할 수
              있게 구성했습니다.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              정산 대기 파티는 정산 승인 관리 화면에서 승인 또는 거절할 수 있고,
              운영 리스크가 큰 파티는 여기서 강제 종료로 바로 전환합니다.
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <FilterTabs
            tabs={FILTER_TABS}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              void handleSearch(tab);
              setPage(1);
            }}
          />

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  키워드
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="파티 ID / 제목 / 서비스 / 리더"
                  className="w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  카테고리
                </span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  시작일
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  종료일
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                />
              </label>
              <div className="flex gap-2 pb-0.5">
                <button
                  type="button"
                  onClick={() => void handleSearch()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  조회
                </button>
                <button
                  type="button"
                  onClick={() => void handleReset()}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  초기화
                </button>
              </div>
            </div>
          </section>

          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
              파티 목록을 불러오는 중입니다.
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 shadow-sm">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      생성 시각
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      파티
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      서비스
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      리더
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      멤버
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      상태
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      월 결제
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      신고
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((party) => {
                    const isExpanded = expandedPartyId === party.id;
                    const isForceEndOpen = forceEndPartyId === party.id;

                    return (
                      <Fragment key={party.id}>
                        <tr className="border-b border-gray-100 transition hover:bg-gray-50">
                          <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                            {party.createdAt}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-900">
                            <div className="font-medium">{party.title}</div>
                            <div className="mt-1 text-xs text-gray-400">
                              생성 {party.createdAt}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            <div>{party.service}</div>
                            <div className="mt-1 text-xs text-gray-400">
                              {party.lastPayment}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {party.leaderId}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {party.memberCount}명
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[party.status]}`}
                            >
                              {party.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {formatWon(party.monthlyAmount)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {party.reportCount}건
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                                  isExpanded
                                    ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => handleViewDetail(party.id)}
                              >
                                {isExpanded ? '닫기' : '상세'}
                              </button>
                              <button
                                className="rounded-md border border-blue-300 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                                onClick={() => setExpandedPartyId(party.id)}
                              >
                                정산
                              </button>
                              {party.status !== '종료됨' && (
                                <button
                                  className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                  disabled={busyPartyId === party.id}
                                  onClick={() => openForceEndEditor(party)}
                                >
                                  {busyPartyId === party.id
                                    ? '처리 중...'
                                    : '강제 종료'}
                                </button>
                              )}
                              <button
                                className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                                  memberPanelPartyId === party.id
                                    ? 'border-violet-300 bg-violet-50 text-violet-600'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => void openMemberPanel(party.id)}
                              >
                                멤버관리
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-b border-gray-100 bg-slate-50/70">
                            <td colSpan={9} className="px-4 py-4">
                              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <h3 className="text-base font-semibold text-slate-900">
                                        {party.title}
                                      </h3>
                                      <p className="mt-1 text-sm text-slate-500">
                                        운영 상태, 정산 메모, 리스크 지표를 한
                                        번에 확인합니다.
                                      </p>
                                    </div>
                                    <span
                                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[party.status]}`}
                                    >
                                      {party.status}
                                    </span>
                                  </div>

                                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    {[
                                      ['생성 시각', party.createdAt],
                                      ['파티명', party.title],
                                      ['서비스', party.service],
                                      ['리더', party.leaderId],
                                      ['멤버 수', `${party.memberCount}명`],
                                      ['신고 수', `${party.reportCount}건`],
                                      [
                                        '월 결제',
                                        formatWon(party.monthlyAmount),
                                      ],
                                      ['최근 정산 메모', party.lastPayment],
                                    ].map(([label, value]) => (
                                      <div
                                        key={label}
                                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                      >
                                        <div className="text-xs font-medium text-slate-400">
                                          {label}
                                        </div>
                                        <div className="mt-1 break-all text-sm font-semibold text-slate-800">
                                          {value}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {memberPanelPartyId === party.id && (
                                    <div className="mt-6">
                                      <div className="mb-3 flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-slate-900">
                                          멤버 관리
                                        </h4>
                                        {memberLoading && (
                                          <span className="text-xs text-slate-400">
                                            불러오는 중...
                                          </span>
                                        )}
                                      </div>
                                      {memberError && (
                                        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                                          {memberError}
                                        </div>
                                      )}
                                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="min-w-full border-collapse">
                                          <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">
                                                멤버
                                              </th>
                                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">
                                                역할
                                              </th>
                                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">
                                                상태
                                              </th>
                                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">
                                                신뢰도
                                              </th>
                                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">
                                                가입일
                                              </th>
                                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">
                                                퇴장일
                                              </th>
                                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">
                                                관리
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {(membersMap[party.id] ?? []).map(
                                              (member) => {
                                                const isKicking =
                                                  kickConfirmId ===
                                                  member.userId;
                                                const isBusy =
                                                  busyMemberId ===
                                                  member.userId;
                                                return (
                                                  <Fragment
                                                    key={member.memberId}
                                                  >
                                                    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                                                      <td className="px-3 py-2.5 text-sm">
                                                        <div className="font-medium text-slate-800">
                                                          {member.nickname}
                                                        </div>
                                                        {member.name && (
                                                          <div className="text-xs text-slate-400">
                                                            {member.name}
                                                          </div>
                                                        )}
                                                      </td>
                                                      <td className="px-3 py-2.5 text-sm">
                                                        <span
                                                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                                            member.role ===
                                                            'leader'
                                                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                                                              : 'border-slate-200 bg-slate-50 text-slate-600'
                                                          }`}
                                                        >
                                                          {member.role ===
                                                          'leader'
                                                            ? '파티장'
                                                            : '멤버'}
                                                        </span>
                                                      </td>
                                                      <td className="px-3 py-2.5 text-sm">
                                                        <span
                                                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                                            member.status ===
                                                            'active'
                                                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                              : 'border-red-200 bg-red-50 text-red-600'
                                                          }`}
                                                        >
                                                          {member.status ===
                                                          'active'
                                                            ? '활성'
                                                            : member.status ===
                                                                'kicked'
                                                              ? '강퇴'
                                                              : '탈퇴'}
                                                        </span>
                                                      </td>
                                                      <td className="px-3 py-2.5 text-xs text-slate-600">
                                                        {member.trustScore.toFixed(
                                                          1,
                                                        )}
                                                      </td>
                                                      <td className="px-3 py-2.5 text-xs text-slate-500">
                                                        {member.joinedAt}
                                                      </td>
                                                      <td className="px-3 py-2.5 text-xs text-slate-400">
                                                        {member.leftAt ?? '-'}
                                                      </td>
                                                      <td className="px-3 py-2.5 text-sm">
                                                        {member.status ===
                                                          'active' && (
                                                          <div className="flex flex-wrap gap-1">
                                                            {member.role ===
                                                              'member' && (
                                                              <button
                                                                className="rounded border border-amber-300 px-2 py-0.5 text-xs text-amber-600 hover:bg-amber-50 transition"
                                                                disabled={
                                                                  isBusy
                                                                }
                                                                onClick={() =>
                                                                  void handleChangeRole(
                                                                    party.id,
                                                                    member.userId,
                                                                    'leader',
                                                                  )
                                                                }
                                                              >
                                                                파티장 임명
                                                              </button>
                                                            )}
                                                            <button
                                                              className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50 transition"
                                                              disabled={isBusy}
                                                              onClick={() => {
                                                                setKickConfirmId(
                                                                  member.userId,
                                                                );
                                                                setKickReason(
                                                                  '',
                                                                );
                                                              }}
                                                            >
                                                              강퇴
                                                            </button>
                                                          </div>
                                                        )}
                                                      </td>
                                                    </tr>
                                                    {isKicking && (
                                                      <tr className="bg-red-50/60 border-b border-slate-100">
                                                        <td
                                                          colSpan={7}
                                                          className="px-3 py-3"
                                                        >
                                                          <div className="flex flex-wrap items-end gap-2">
                                                            <div className="flex flex-col gap-1">
                                                              <span className="text-xs font-medium text-slate-600">
                                                                강퇴 사유
                                                              </span>
                                                              <input
                                                                type="text"
                                                                value={
                                                                  kickReason
                                                                }
                                                                onChange={(e) =>
                                                                  setKickReason(
                                                                    e.target
                                                                      .value,
                                                                  )
                                                                }
                                                                placeholder="사유 입력 (선택)"
                                                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-red-300 w-56"
                                                              />
                                                            </div>
                                                            <button
                                                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                                                              disabled={isBusy}
                                                              onClick={() =>
                                                                void handleKickMember(
                                                                  party.id,
                                                                  member.userId,
                                                                )
                                                              }
                                                            >
                                                              {isBusy
                                                                ? '처리 중...'
                                                                : '강퇴 확인'}
                                                            </button>
                                                            <button
                                                              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition"
                                                              onClick={() =>
                                                                setKickConfirmId(
                                                                  null,
                                                                )
                                                              }
                                                            >
                                                              취소
                                                            </button>
                                                            {member.role ===
                                                              'leader' && (
                                                              <span className="text-xs text-amber-600 font-medium">
                                                                ⚠ 파티장 강퇴 시
                                                                다음 멤버가 자동
                                                                승계됩니다
                                                              </span>
                                                            )}
                                                          </div>
                                                        </td>
                                                      </tr>
                                                    )}
                                                  </Fragment>
                                                );
                                              },
                                            )}
                                            {(membersMap[party.id] ?? [])
                                              .length === 0 &&
                                              !memberLoading && (
                                                <tr>
                                                  <td
                                                    colSpan={7}
                                                    className="px-3 py-6 text-center text-sm text-slate-400"
                                                  >
                                                    멤버 정보가 없습니다.
                                                  </td>
                                                </tr>
                                              )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {isForceEndOpen && (
                                  <div className="rounded-2xl border border-red-100 bg-red-50/70 p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-slate-900">
                                      강제 종료
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                      팝업 대신 이 패널에서 강제 종료 사유를
                                      입력하고 바로 처리합니다.
                                    </p>
                                    <label className="mt-4 block">
                                      <span className="text-sm font-medium text-slate-700">
                                        종료 사유
                                      </span>
                                      <textarea
                                        value={forceEndReason}
                                        onChange={(event) =>
                                          setForceEndReason(event.target.value)
                                        }
                                        rows={4}
                                        placeholder="강제 종료 사유를 입력하세요."
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-red-300"
                                      />
                                    </label>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        disabled={busyPartyId === party.id}
                                        onClick={() =>
                                          void handleForceEnd(party)
                                        }
                                      >
                                        {busyPartyId === party.id
                                          ? '처리 중...'
                                          : '강제 종료 저장'}
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                        onClick={() => setForceEndPartyId(null)}
                                      >
                                        취소
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {paginated.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center text-sm text-gray-400"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              total={filtered.length}
              page={page}
              pageSize={20}
              onChange={(p) => {
                setPage(p);
              }}
            />
            <div className="px-4 py-3 text-xs text-gray-400">
              위험 상태 파티는 신고 누적과 현재 운영 상태를 기준으로 표시하며,
              강제 종료 버튼은 실제 관리자 API를 호출합니다.
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
