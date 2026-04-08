import { Fragment, useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import {
  fetchAdminParties,
  forceEndAdminParty,
  getAdminErrorMessage,
  type AdminPartyRecord,
} from '../../apis/admin';

const STATUS_STYLE: Record<string, string> = {
  운영중: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  모집중: 'bg-blue-50 text-blue-600 border-blue-100',
  위험: 'bg-amber-50 text-amber-600 border-amber-100',
  '종료 예정': 'bg-red-50 text-red-600 border-red-100',
};

const FILTER_TABS = ['전체', '운영중', '모집중', '위험', '종료 예정'];

const formatWon = (amount: number) => `₩ ${amount.toLocaleString()}`;

export default function AdminParties() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [parties, setParties] = useState<AdminPartyRecord[]>([]);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [expandedPartyId, setExpandedPartyId] = useState<string | null>(null);
  const [forceEndPartyId, setForceEndPartyId] = useState<string | null>(null);
  const [forceEndReason, setForceEndReason] = useState('운영 정책 위반');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyPartyId, setBusyPartyId] = useState<string | null>(null);

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

  const reloadParties = async () => {
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

  const filtered = useMemo(() => {
    let data = parties;

    if (activeTab !== '전체') {
      data = data.filter((party) => party.status === activeTab);
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (party) =>
          party.id.toLowerCase().includes(q) ||
          party.service.toLowerCase().includes(q) ||
          party.leaderId.toLowerCase().includes(q) ||
          party.status.toLowerCase().includes(q),
      );
    }

    return data;
  }, [activeTab, parties, search]);

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
        label: '종료 예정',
        value: `${parties.filter((party) => party.status === '종료 예정').length}`,
      },
    ],
    [parties],
  );

  return (
    <>
      <AdminHeader
        placeholder="파티 검색 (파티 ID/서비스/리더)..."
        onSearch={setSearch}
        rightContent={
          <button
            className="rounded-md border border-gray-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            onClick={() => setIsPolicyOpen((prev) => !prev)}
          >
            {isPolicyOpen ? '정책 닫기' : '정산 정책'}
          </button>
        }
      />
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section>
            <h1 className="text-2xl font-bold text-gray-900">파티관리</h1>
            <p className="mt-1 text-sm text-gray-500">
              파티 운영 상태, 신고 누적, 최근 정산 이슈를 한 화면에서 관리할 수
              있게 구성했습니다.
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
            onTabChange={setActiveTab}
          />

          {isPolicyOpen && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 text-sm text-slate-600 shadow-sm">
              정산 대기 파티는 정산 승인 관리 화면에서 승인 또는 거절할 수 있고,
              운영 리스크가 큰 파티는 여기서 강제 종료로 전환합니다.
            </section>
          )}

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
                  {filtered.map((party) => {
                    const isExpanded = expandedPartyId === party.id;
                    const isForceEndOpen = forceEndPartyId === party.id;

                    return (
                      <Fragment key={party.id}>
                        <tr className="border-b border-gray-100 transition hover:bg-gray-50">
                          <td className="px-4 py-3.5 text-sm font-medium text-gray-900">
                            {party.id}
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
                              {party.status !== '종료 예정' && (
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
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-b border-gray-100 bg-slate-50/70">
                            <td colSpan={8} className="px-4 py-4">
                              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <h3 className="text-base font-semibold text-slate-900">
                                        {party.service} 파티
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
                                      ['파티 ID', party.id],
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
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-sm text-gray-400"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
              위험 상태 파티는 신고 누적과 현재 운영 상태를 기준으로 표시하며,
              강제 종료 버튼은 실제 관리자 API를 호출합니다.
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
