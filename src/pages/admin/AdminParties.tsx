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
  const [isGuideOpen, setIsGuideOpen] = useState(true);
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
    const timer = setInterval(() => {
      void loadParties();
    }, 30_000);
    return () => {
      alive = false;
      clearInterval(timer);
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
      await reloadParties();
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
      await reloadParties();
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
        label: '종료됨',
        value: `${parties.filter((party) => party.status === '종료됨').length}`,
      },
    ],
    [parties],
  );

  return (
    // 💡 부모 태그를 플렉스 컨테이너로 묶어 가로 축소 방지
    <div className="flex w-full min-w-0 flex-1 flex-col">
      <AdminHeader
        placeholder="파티 검색 (파티명/서비스/리더)..."
        onSearch={setSearch}
      />

      {/* 💡 전반적인 패딩 최적화 */}
      <div className="flex-1 bg-[#f5f5f5] p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
          <section>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-keep">
              파티관리
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 break-keep">
              파티 운영 상태, 신고 누적, 최근 정산 이슈를 한 화면에서 관리할 수
              있게 구성했습니다.
            </p>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-gray-500 break-keep">
              정산 대기 파티는 정산 승인 관리 화면에서 승인 또는 거절할 수 있고,
              운영 리스크가 큰 파티는 여기서 강제 종료로 바로 전환합니다.
            </p>
          </section>

          {/* 💡 요약 카드 2단 그리드 처리 */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {summary.map((item) => (
              <div
                key={item.label}
                className="rounded-xl md:rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm"
              >
                <p className="text-[11px] md:text-sm text-gray-500 truncate">
                  {item.label}
                </p>
                <p className="mt-1 md:mt-2 text-xl md:text-2xl font-bold text-gray-900">
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

          {/* 💡 검색 필터 영역 모바일 최적화 (flex-col 기반 유연한 배치) */}
          <section className="rounded-xl md:rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="flex w-full sm:w-auto flex-col gap-1.5">
                <span className="text-[11px] md:text-xs font-medium text-gray-500">
                  키워드
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="파티 ID / 제목 / 서비스 / 리더"
                  className="w-full sm:w-64 rounded-lg md:rounded-xl border border-gray-200 px-3.5 py-2 md:py-2.5 text-sm outline-none transition focus:border-blue-400"
                />
              </label>

              <label className="flex w-full sm:w-auto flex-col gap-1.5">
                <span className="text-[11px] md:text-xs font-medium text-gray-500">
                  카테고리
                </span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full sm:w-auto rounded-lg md:rounded-xl border border-gray-200 px-3.5 py-2 md:py-2.5 text-sm outline-none transition focus:border-blue-400 bg-white"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex w-full sm:w-auto gap-2">
                <label className="flex flex-1 sm:flex-none flex-col gap-1.5">
                  <span className="text-[11px] md:text-xs font-medium text-gray-500">
                    시작일
                  </span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="w-full rounded-lg md:rounded-xl border border-gray-200 px-3 py-2 md:py-2.5 text-xs md:text-sm outline-none transition focus:border-blue-400"
                  />
                </label>
                <label className="flex flex-1 sm:flex-none flex-col gap-1.5">
                  <span className="text-[11px] md:text-xs font-medium text-gray-500">
                    종료일
                  </span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="w-full rounded-lg md:rounded-xl border border-gray-200 px-3 py-2 md:py-2.5 text-xs md:text-sm outline-none transition focus:border-blue-400"
                  />
                </label>
              </div>

              <div className="mt-1 flex w-full sm:w-auto gap-2 sm:ml-auto">
                <button
                  type="button"
                  onClick={() => void handleSearch()}
                  className="flex-1 sm:flex-none rounded-lg md:rounded-xl bg-blue-600 px-4 py-2.5 text-xs md:text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                >
                  조회
                </button>
                <button
                  type="button"
                  onClick={() => void handleReset()}
                  className="flex-1 sm:flex-none rounded-lg md:rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs md:text-sm font-medium text-gray-600 transition hover:bg-gray-50 active:scale-95"
                >
                  초기화
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 shadow-sm">
            <button
              type="button"
              onClick={() => setIsGuideOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div className="text-[11px] md:text-xs font-semibold text-slate-500">
                파티관리 메뉴얼
              </div>
              <span className="shrink-0 text-xs font-bold text-slate-500">
                {isGuideOpen ? '접기' : '펼치기'}
              </span>
            </button>

            {isGuideOpen && (
              <div className="mt-3 space-y-3 text-[11px] md:text-xs text-slate-600">
                <div className="rounded-xl border border-white bg-white px-4 py-4">
                  <div className="text-sm font-bold text-slate-900">
                    파티관리 메뉴얼
                  </div>
                  <p className="mt-2 leading-relaxed">
                    파티관리 페이지는 파티 상태, 신고 수, 멤버 구성, 정산 메모를
                    함께 보고 운영 이슈가 있는 파티를 빠르게 대응하는
                    화면입니다. 멤버 관리, 파티장 변경, 강퇴, 강제 종료까지
                    이곳에서 처리할 수 있습니다.
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-white bg-white px-4 py-4">
                    <div className="font-bold text-slate-800">
                      이 페이지에서 할 수 있는 기능
                    </div>
                    <div className="mt-2 space-y-2 leading-relaxed">
                      <p>
                        1. 파티명, 서비스, 리더, 카테고리, 상태 기준으로 파티를
                        검색하고 위험 파티를 골라 볼 수 있습니다.
                      </p>
                      <p>
                        2. 파티 상세에서 생성 시각, 멤버 수, 신고 수, 월 결제
                        상태를 함께 확인할 수 있습니다.
                      </p>
                      <p>
                        3. 멤버관리에서 파티장 임명, 멤버 강퇴, 현재 구성원
                        상태를 운영할 수 있습니다.
                      </p>
                      <p>
                        4. 운영 정책 위반이나 리스크가 큰 파티는 강제 종료로
                        바로 종료 처리할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white bg-white px-4 py-4">
                    <div className="font-bold text-slate-800">사용 방법</div>
                    <div className="mt-2 space-y-2 leading-relaxed">
                      <p>
                        1. 상단 필터에서 상태와 카테고리를 좁혀 필요한 파티만
                        먼저 조회합니다.
                      </p>
                      <p>
                        2. 목록에서 `상세`를 눌러 파티 기본 정보와 신고/정산
                        상태를 확인합니다.
                      </p>
                      <p>
                        3. 멤버 구성이 문제면 `멤버관리`를 열어 파티장 변경이나
                        강퇴를 진행합니다.
                      </p>
                      <p>
                        4. 정상 운영이 어렵다고 판단되면 종료 사유를 입력하고
                        강제 종료를 반영합니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-4">
                  <div className="font-bold text-slate-800">운영 시 참고</div>
                  <div className="mt-2 space-y-1.5 leading-relaxed text-slate-600">
                    <p>
                      파티장 강퇴 시에는 다음 활성 멤버에게 자동으로 리더 권한이
                      승계되므로, 현재 멤버 구성을 먼저 확인하는 것이 좋습니다.
                    </p>
                    <p>
                      강제 종료는 참여 중인 멤버 전체에게 영향이 가는
                      작업이라서, 종료 사유를 명확히 남겨두는 것을 권장합니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {loading && (
            <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white px-4 py-3 md:px-5 md:py-4 text-xs md:text-sm text-gray-500 shadow-sm">
              파티 목록을 불러오는 중입니다.
            </div>
          )}

          {error && (
            <div className="rounded-xl md:rounded-2xl border border-red-200 bg-red-50 px-4 py-3 md:px-5 md:py-4 text-xs md:text-sm text-red-600 shadow-sm">
              {error}
            </div>
          )}

          {/* 💡 테이블 영역 최적화 (가로 스크롤 허용) */}
          <section className="overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              <table className="min-w-250 w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      생성 시각
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      파티
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      서비스
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      리더
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      멤버
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      상태
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      월 결제
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
                      신고
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-3.5 text-left text-[11px] md:text-sm font-semibold text-gray-500 whitespace-nowrap">
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
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-500 whitespace-nowrap">
                            {party.createdAt}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-xs md:text-sm text-gray-900 break-keep">
                            <div className="font-bold">{party.title}</div>
                            <div className="mt-0.5 text-[10px] md:text-xs text-gray-400">
                              생성 {party.createdAt}
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            <div className="font-semibold">{party.service}</div>
                            <div className="mt-0.5 text-[10px] md:text-xs text-gray-400">
                              {party.lastPayment}
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            {party.leaderNickname}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            {party.memberCount}명
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-sm">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-bold ${STATUS_STYLE[party.status]}`}
                            >
                              {party.status}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            {formatWon(party.monthlyAmount)}
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-[11px] md:text-sm text-gray-600 whitespace-nowrap">
                            {party.reportCount}건
                          </td>
                          <td className="px-3 md:px-4 py-3.5 text-sm">
                            <div className="flex flex-wrap gap-1.5 min-w-37.5">
                              <button
                                className={`rounded-lg border px-2.5 py-1.5 text-[10px] md:text-xs font-bold transition active:scale-95 ${
                                  isExpanded
                                    ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => handleViewDetail(party.id)}
                              >
                                {isExpanded ? '닫기' : '상세'}
                              </button>
                              <button
                                className="rounded-lg border border-blue-300 px-2.5 py-1.5 text-[10px] md:text-xs font-bold text-blue-600 transition hover:bg-blue-50 active:scale-95"
                                onClick={() => setExpandedPartyId(party.id)}
                              >
                                정산
                              </button>
                              {party.status !== '종료됨' && (
                                <button
                                  className="rounded-lg border border-red-300 px-2.5 py-1.5 text-[10px] md:text-xs font-bold text-red-500 transition hover:bg-red-50 active:scale-95"
                                  disabled={busyPartyId === party.id}
                                  onClick={() => openForceEndEditor(party)}
                                >
                                  {busyPartyId === party.id
                                    ? '처리 중...'
                                    : '강제 종료'}
                                </button>
                              )}
                              <button
                                className={`rounded-lg border px-2.5 py-1.5 text-[10px] md:text-xs font-bold transition active:scale-95 ${
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

                        {/* 💡 확장 상세 패널 */}
                        {isExpanded && (
                          <tr className="border-b border-gray-100 bg-slate-50/70">
                            <td colSpan={9} className="p-3 md:px-4 md:py-4">
                              <div className="grid gap-3 md:gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
                                <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                                  <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <h3 className="text-sm md:text-base font-bold text-slate-900 break-keep">
                                        {party.title}
                                      </h3>
                                      <p className="mt-1 text-[11px] md:text-sm text-slate-500 break-keep">
                                        운영 상태, 정산 메모, 리스크 지표를 한
                                        번에 확인합니다.
                                      </p>
                                    </div>
                                    <span
                                      className={`inline-flex self-start lg:self-auto rounded-full border px-2.5 py-1 text-[10px] md:text-xs font-bold ${STATUS_STYLE[party.status]}`}
                                    >
                                      {party.status}
                                    </span>
                                  </div>

                                  <div className="mt-4 md:mt-5 grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4">
                                    {[
                                      ['생성 시각', party.createdAt],
                                      ['파티명', party.title],
                                      ['서비스', party.service],
                                      ['리더', party.leaderNickname],
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
                                        className="rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:px-4 md:py-3"
                                      >
                                        <div className="text-[10px] md:text-xs font-medium text-slate-400">
                                          {label}
                                        </div>
                                        <div className="mt-1 truncate text-xs md:text-sm font-bold text-slate-800">
                                          {value}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* 💡 멤버 관리 서브 테이블 영역 */}
                                  {memberPanelPartyId === party.id && (
                                    <div className="mt-5 md:mt-6">
                                      <div className="mb-2.5 md:mb-3 flex items-center justify-between">
                                        <h4 className="text-xs md:text-sm font-bold text-slate-900">
                                          멤버 관리
                                        </h4>
                                        {memberLoading && (
                                          <span className="text-[10px] md:text-xs text-slate-400">
                                            불러오는 중...
                                          </span>
                                        )}
                                      </div>
                                      {memberError && (
                                        <div className="mb-2.5 md:mb-3 rounded-lg md:rounded-xl border border-red-200 bg-red-50 px-3 py-2 md:px-4 md:py-2 text-[11px] md:text-sm text-red-600">
                                          {memberError}
                                        </div>
                                      )}
                                      {/* 내부 테이블 가로 스크롤 적용 */}
                                      <div className="overflow-x-auto rounded-lg md:rounded-xl border border-slate-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                        <table className="min-w-162.5 w-full border-collapse">
                                          <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                              <th className="px-3 py-2.5 text-left text-[11px] md:text-xs font-semibold text-slate-500">
                                                멤버
                                              </th>
                                              <th className="px-3 py-2.5 text-left text-[11px] md:text-xs font-semibold text-slate-500">
                                                역할
                                              </th>
                                              <th className="px-3 py-2.5 text-left text-[11px] md:text-xs font-semibold text-slate-500">
                                                상태
                                              </th>
                                              <th className="px-3 py-2.5 text-left text-[11px] md:text-xs font-semibold text-slate-500">
                                                신뢰도
                                              </th>
                                              <th className="px-3 py-2.5 text-left text-[11px] md:text-xs font-semibold text-slate-500">
                                                가입일
                                              </th>
                                              <th className="px-3 py-2.5 text-left text-[11px] md:text-xs font-semibold text-slate-500">
                                                퇴장일
                                              </th>
                                              <th className="px-3 py-2.5 text-left text-[11px] md:text-xs font-semibold text-slate-500">
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
                                                      <td className="px-3 py-2.5 text-xs md:text-sm">
                                                        <div className="font-bold text-slate-800">
                                                          {member.nickname}
                                                        </div>
                                                        {member.name && (
                                                          <div className="text-[10px] md:text-xs text-slate-400">
                                                            {member.name}
                                                          </div>
                                                        )}
                                                      </td>
                                                      <td className="px-3 py-2.5">
                                                        <span
                                                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
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
                                                      <td className="px-3 py-2.5">
                                                        <span
                                                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
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
                                                      <td className="px-3 py-2.5 text-[11px] md:text-xs text-slate-600">
                                                        {member.trustScore.toFixed(
                                                          1,
                                                        )}
                                                      </td>
                                                      <td className="px-3 py-2.5 text-[10px] md:text-xs text-slate-500 whitespace-nowrap">
                                                        {member.joinedAt}
                                                      </td>
                                                      <td className="px-3 py-2.5 text-[10px] md:text-xs text-slate-400 whitespace-nowrap">
                                                        {member.leftAt ?? '-'}
                                                      </td>
                                                      <td className="px-3 py-2.5 text-sm">
                                                        {member.status ===
                                                          'active' && (
                                                          <div className="flex flex-wrap gap-1.5">
                                                            {member.role ===
                                                              'member' && (
                                                              <button
                                                                className="rounded border border-amber-300 px-2 py-1 text-[10px] font-bold text-amber-600 hover:bg-amber-50 transition active:scale-95"
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
                                                              className="rounded border border-red-300 px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-50 transition active:scale-95"
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

                                                    {/* 💡 강퇴 UI 폼도 모바일에서 스태킹되도록 수정 */}
                                                    {isKicking && (
                                                      <tr className="bg-red-50/60 border-b border-slate-100">
                                                        <td
                                                          colSpan={7}
                                                          className="px-3 py-3"
                                                        >
                                                          <div className="flex flex-col sm:flex-row sm:items-end gap-2.5">
                                                            <div className="flex flex-col gap-1 w-full sm:w-auto">
                                                              <span className="text-[10px] md:text-xs font-bold text-slate-600">
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
                                                                className="w-full sm:w-56 rounded-lg border border-slate-200 px-3 py-2 text-xs md:text-sm outline-none focus:border-red-300"
                                                              />
                                                            </div>
                                                            <div className="flex w-full sm:w-auto gap-2">
                                                              <button
                                                                className="flex-1 sm:flex-none rounded-lg bg-red-600 px-4 py-2 text-[11px] md:text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50 active:scale-95"
                                                                disabled={
                                                                  isBusy
                                                                }
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
                                                                className="flex-1 sm:flex-none rounded-lg border border-slate-200 bg-white px-4 py-2 text-[11px] md:text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95"
                                                                onClick={() =>
                                                                  setKickConfirmId(
                                                                    null,
                                                                  )
                                                                }
                                                              >
                                                                취소
                                                              </button>
                                                            </div>
                                                            {member.role ===
                                                              'leader' && (
                                                              <span className="mt-1 sm:mt-0 text-[10px] md:text-xs text-amber-600 font-bold">
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
                                                    className="px-3 py-8 text-center text-xs md:text-sm text-slate-400"
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

                                {/* 💡 강제 종료 폼 패널 모바일 최적화 */}
                                {isForceEndOpen && (
                                  <div className="rounded-xl md:rounded-2xl border border-red-100 bg-red-50/70 p-4 md:p-5 shadow-sm self-start">
                                    <h3 className="text-sm md:text-base font-bold text-slate-900">
                                      강제 종료
                                    </h3>
                                    <p className="mt-1 text-[11px] md:text-sm text-slate-500 break-keep">
                                      팝업 대신 이 패널에서 강제 종료 사유를
                                      입력하고 바로 처리합니다.
                                    </p>
                                    <label className="mt-4 block">
                                      <span className="text-[11px] md:text-sm font-bold text-slate-700">
                                        종료 사유
                                      </span>
                                      <textarea
                                        value={forceEndReason}
                                        onChange={(event) =>
                                          setForceEndReason(event.target.value)
                                        }
                                        rows={3}
                                        placeholder="강제 종료 사유를 입력하세요."
                                        className="mt-2 w-full rounded-lg md:rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-slate-700 outline-none transition focus:border-red-300"
                                      />
                                    </label>
                                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                      <button
                                        type="button"
                                        className="w-full sm:w-auto rounded-lg bg-red-600 px-4 py-2.5 text-xs md:text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
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
                                        className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs md:text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95"
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
                        className="px-4 py-12 md:py-16 text-center text-xs md:text-sm text-gray-400"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-2 md:mt-0">
              <Pagination
                total={filtered.length}
                page={page}
                pageSize={20}
                onChange={(p) => {
                  setPage(p);
                }}
              />
            </div>

            <div className="border-t border-gray-100 bg-slate-50/50 px-4 py-3 text-[10px] md:text-xs text-gray-400 break-keep">
              위험 상태 파티는 신고 누적과 현재 운영 상태를 기준으로 표시하며,
              강제 종료 버튼은 실제 관리자 API를 호출합니다.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
