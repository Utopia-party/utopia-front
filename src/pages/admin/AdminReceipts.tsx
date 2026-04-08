import { Fragment, useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import {
  fetchAdminReceipts,
  getAdminErrorMessage,
  updateAdminReceiptStatus,
  type ReceiptRecord,
} from '../../apis/admin';

const STATUS_STYLE: Record<string, string> = {
  대기: 'text-amber-500 bg-amber-50',
  승인: 'text-emerald-500 bg-emerald-50',
  거절: 'text-red-500 bg-red-50',
};

const FILTER_TABS = ['전체', '대기', '승인', '거절'];

const formatWon = (amount: number) => `₩ ${amount.toLocaleString()}`;

export default function AdminReceipts() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyReceiptId, setBusyReceiptId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadReceipts = async () => {
      try {
        setLoading(true);
        setError('');
        const nextReceipts = await fetchAdminReceipts();
        if (alive) {
          setReceipts(nextReceipts);
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

    void loadReceipts();
    return () => {
      alive = false;
    };
  }, []);

  const reloadReceipts = async () => {
    setLoading(true);
    setError('');
    try {
      setReceipts(await fetchAdminReceipts());
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptStatus = async (receiptId: string, status: string) => {
    try {
      setBusyReceiptId(receiptId);
      await updateAdminReceiptStatus(receiptId, status);
      await reloadReceipts();
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setBusyReceiptId(null);
    }
  };

  const filtered = useMemo(() => {
    let data = receipts;
    if (activeTab !== '전체') {
      data = data.filter((r) => r.status === activeTab);
    }
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.userId.toLowerCase().includes(q) ||
          r.partyId.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q),
      );
    }
    return data;
  }, [activeTab, receipts, search]);

  return (
    <>
      <AdminHeader
        placeholder="영수증 검색 (user/party/status)..."
        onSearch={setSearch}
      />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-1">영수증 승인 관리</h1>
        <p className="text-sm text-gray-500 mb-6">
          OCR 결과 확인 · 수동 승인/거절
        </p>

        <FilterTabs
          tabs={FILTER_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {loading && (
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
            영수증 목록을 불러오는 중입니다.
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
                  Receipt ID
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  사용자
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  파티
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  OCR 금액
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  상태
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((receipt) => {
                const isExpanded = expandedReceiptId === receipt.id;

                return (
                  <Fragment key={receipt.id}>
                    <tr className="border-b border-gray-100 transition hover:bg-gray-50">
                      <td className="px-4 py-3.5 text-sm">{receipt.id}</td>
                      <td className="px-4 py-3.5 text-sm">{receipt.userId}</td>
                      <td className="px-4 py-3.5 text-sm">{receipt.partyId}</td>
                      <td className="px-4 py-3.5 text-sm">
                        {formatWon(receipt.ocrAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[receipt.status] ?? ''}`}
                        >
                          {receipt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        <div className="flex gap-1.5 items-center">
                          <button
                            className={`px-3 py-1 rounded-md text-xs border transition ${
                              isExpanded
                                ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() =>
                              setExpandedReceiptId((prev) =>
                                prev === receipt.id ? null : receipt.id,
                              )
                            }
                          >
                            {isExpanded
                              ? '닫기'
                              : receipt.status === '대기'
                                ? 'OCR 확인'
                                : '상세'}
                          </button>
                          {receipt.status === '대기' && (
                            <>
                              <button
                                className="px-3 py-1 rounded-md text-xs border border-blue-300 text-blue-500 hover:bg-blue-50 cursor-pointer transition"
                                disabled={busyReceiptId === receipt.id}
                                onClick={() =>
                                  void handleReceiptStatus(receipt.id, '승인')
                                }
                              >
                                {busyReceiptId === receipt.id
                                  ? '처리 중...'
                                  : '승인'}
                              </button>
                              <button
                                className="px-3 py-1 rounded-md text-xs border border-red-300 text-red-500 hover:bg-red-50 cursor-pointer transition"
                                disabled={busyReceiptId === receipt.id}
                                onClick={() =>
                                  void handleReceiptStatus(receipt.id, '거절')
                                }
                              >
                                거절
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="border-b border-gray-100 bg-slate-50/70">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                  영수증 상세
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                  OCR 추출 결과와 업로드 맥락을 화면 안에서
                                  확인하고 바로 승인 또는 거절할 수 있습니다.
                                </p>
                              </div>
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[receipt.status] ?? ''}`}
                              >
                                {receipt.status}
                              </span>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              {[
                                ['Receipt ID', receipt.id],
                                ['사용자', receipt.userId],
                                ['파티', receipt.partyId],
                                ['OCR 금액', formatWon(receipt.ocrAmount)],
                                ['상태', receipt.status],
                                ['업로드 시각', receipt.createdAt],
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

                            {receipt.status === '대기' && (
                              <div className="mt-5 flex flex-wrap gap-2">
                                <button
                                  className="rounded-md border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                                  disabled={busyReceiptId === receipt.id}
                                  onClick={() =>
                                    void handleReceiptStatus(receipt.id, '승인')
                                  }
                                >
                                  {busyReceiptId === receipt.id
                                    ? '처리 중...'
                                    : '승인'}
                                </button>
                                <button
                                  className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                                  disabled={busyReceiptId === receipt.id}
                                  onClick={() =>
                                    void handleReceiptStatus(receipt.id, '거절')
                                  }
                                >
                                  거절
                                </button>
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
                  <td colSpan={6} className="text-center text-gray-400 py-8">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
            승인과 거절 버튼은 실제 영수증 관리자 API를 호출합니다.
          </div>
        </div>
      </div>
    </>
  );
}
