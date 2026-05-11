import { useCallback, useEffect, useState } from 'react';
import {
  Copy,
  Eye,
  EyeOff,
  Key,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import {
  createSaasKey,
  fetchSaasKeys,
  fetchSaasStats,
  fetchKeyUsageLogs,
  rotateSecretKey,
  resetKeyUsage,
  updateSaasKey,
  fetchPlanInquiries,
  updatePlanInquiryStatus,
  type ApiKeyItem,
  type UsageStats,
  type UsageLogItem,
  type PlanInquiryItem,
} from '../../apis/admin';

// ── 유틸 ────────────────────────────────────────────────

function maskKey(key: string) {
  if (key.length <= 12) return '••••••••';
  return key.slice(0, 12) + '••••••••';
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function planLabel(plan: string) {
  const map: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise',
  };
  return map[plan] ?? plan;
}

function planColor(plan: string) {
  const map: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    starter: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  };
  return map[plan] ?? 'bg-gray-100 text-gray-700';
}

// ── 통계 카드 ────────────────────────────────────────────

function StatsCards({ stats }: { stats: UsageStats | null }) {
  if (!stats) return null;
  const cards = [
    { label: '전체 API 키', value: stats.total_keys, color: 'border-blue-400' },
    { label: '활성 키', value: stats.active_keys, color: 'border-green-400' },
    {
      label: '비활성 키',
      value: stats.total_keys - stats.active_keys,
      color: 'border-red-400',
    },
    {
      label: '이번 달 총 사용량',
      value: stats.total_usage_this_month.toLocaleString(),
      color: 'border-purple-400',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl border-l-4 ${c.color} bg-white p-4 shadow-sm`}
        >
          <p className="text-xs text-gray-500">{c.label}</p>
          <p className="mt-1 text-2xl font-bold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── 키 발급 모달 ─────────────────────────────────────────

function CreateKeyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (key: ApiKeyItem) => void;
}) {
  const [clientName, setClientName] = useState('');
  const [domains, setDomains] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState(1000);
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!clientName.trim()) return;
    setLoading(true);
    try {
      const allowed = domains
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
      const created = await createSaasKey({
        client_name: clientName,
        allowed_domains: allowed.length > 0 ? allowed : undefined,
        monthly_limit: monthlyLimit,
        plan,
      });
      onCreated(created);
    } catch {
      alert('키 발급에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">새 API 키 발급</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              파트너사명 <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="예: TechCorp"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              허용 도메인 (콤마 구분)
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder="예: techcorp.com, *.techcorp.com"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                월간 한도
              </label>
              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                min={100}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                플랜
              </label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !clientName.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '발급 중...' : '발급하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 키 생성 완료 모달 (site_key / secret_key 보여주기) ──────

function KeyCreatedModal({
  item,
  onClose,
}: {
  item: ApiKeyItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-bold text-green-700">
          API 키 발급 완료
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          Secret Key는 이 화면을 닫으면 다시 볼 수 없습니다. 반드시 복사해
          두세요.
        </p>

        <div className="space-y-3">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="mb-1 text-xs font-medium text-gray-500">
              Site Key (공개)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all text-sm">{item.api_key}</code>
              <button
                onClick={() => copyToClipboard(item.api_key)}
                className="text-gray-400 hover:text-blue-600"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-red-50 p-3">
            <p className="mb-1 text-xs font-medium text-red-500">
              Secret Key (비공개 — 서버에서만 사용)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all text-sm">
                {item.secret_key}
              </code>
              <button
                onClick={() => copyToClipboard(item.secret_key)}
                className="text-gray-400 hover:text-red-600"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 사용 로그 모달 ───────────────────────────────────────

function UsageLogModal({
  keyId,
  clientName,
  onClose,
}: {
  keyId: string;
  clientName: string;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<UsageLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchKeyUsageLogs(keyId, { page, size: 20 })
      .then((res) => {
        setLogs(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [keyId, page]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="font-bold">{clientName} — 사용 로그</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="overflow-auto p-6"
          style={{ maxHeight: 'calc(80vh - 80px)' }}
        >
          {loading ? (
            <p className="text-center text-sm text-gray-400">로딩 중...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-sm text-gray-400">
              사용 로그가 없습니다.
            </p>
          ) : (
            <>
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs text-gray-500">
                  <tr>
                    <th className="pb-2">시간</th>
                    <th className="pb-2">엔드포인트</th>
                    <th className="pb-2">도메인</th>
                    <th className="pb-2">IP</th>
                    <th className="pb-2">상태</th>
                    <th className="pb-2">응답(ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-2 text-xs text-gray-500">
                        {log.created_at ?? '-'}
                      </td>
                      <td className="py-2">
                        <code className="text-xs">{log.endpoint}</code>
                      </td>
                      <td className="py-2 text-xs">
                        {log.origin_domain ?? '-'}
                      </td>
                      <td className="py-2 text-xs text-gray-500">
                        {log.client_ip ?? '-'}
                      </td>
                      <td className="py-2">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                            log.status_code === 200
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {log.status_code}
                        </span>
                      </td>
                      <td className="py-2 text-xs">{log.response_time_ms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                  >
                    이전
                  </button>
                  <span className="text-xs text-gray-500">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 키 수정 모달 ─────────────────────────────────────────

function EditKeyModal({
  item,
  onClose,
  onUpdated,
}: {
  item: ApiKeyItem;
  onClose: () => void;
  onUpdated: (updated: ApiKeyItem) => void;
}) {
  const [clientName, setClientName] = useState(item.client_name);
  const [domains, setDomains] = useState(
    item.allowed_domains?.join(', ') ?? '',
  );
  const [monthlyLimit, setMonthlyLimit] = useState(item.monthly_limit);
  const [plan, setPlan] = useState(item.plan);
  const [isActive, setIsActive] = useState(item.is_active);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const allowed = domains
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
      const updated = await updateSaasKey(item.id, {
        client_name: clientName,
        allowed_domains: allowed,
        monthly_limit: monthlyLimit,
        plan,
        is_active: isActive,
      });
      onUpdated(updated);
    } catch {
      alert('수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">API 키 수정</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              파트너사명
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              허용 도메인 (콤마 구분)
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                월간 한도
              </label>
              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                min={100}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                플랜
              </label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                value={plan}
                onChange={(e) => {
                  const newPlan = e.target.value;
                  setPlan(newPlan);
                  const limits: Record<string, number> = {
                    free: 1000,
                    starter: 5000,
                    pro: 30000,
                    enterprise: 1000000,
                  };
                  if (limits[newPlan]) setMonthlyLimit(limits[newPlan]);
                }}
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              활성 상태
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────

export default function AdminSaas() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // 모달 상태
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyItem | null>(null);
  const [editKey, setEditKey] = useState<ApiKeyItem | null>(null);
  const [logKey, setLogKey] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSaasKeys({
        page,
        size: 20,
        search: search || undefined,
      });
      setKeys(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const loadStats = useCallback(async () => {
    try {
      const s = await fetchSaasStats();
      setStats(s);
    } catch {
      /* 통계 실패해도 무시 */
    }
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const totalPages = Math.ceil(total / 20);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleRotateSecret = async (item: ApiKeyItem) => {
    if (!confirm(`${item.client_name}의 Secret Key를 재발급하시겠습니까?`))
      return;
    try {
      const updated = await rotateSecretKey(item.id);
      setKeys((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
      setShowSecrets((prev) => ({ ...prev, [updated.id]: true }));
      alert('Secret Key가 재발급되었습니다. 반드시 복사해 두세요.');
    } catch {
      alert('재발급에 실패했습니다.');
    }
  };

  const handleResetUsage = async (item: ApiKeyItem) => {
    if (!confirm(`${item.client_name}의 월간 사용량을 초기화하시겠습니까?`))
      return;
    try {
      await resetKeyUsage(item.id);
      void loadKeys();
      void loadStats();
    } catch {
      alert('초기화에 실패했습니다.');
    }
  };

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'keys' | 'inquiries'>('keys');

  // 플랜 문의 관리
  const [inquiries, setInquiries] = useState<PlanInquiryItem[]>([]);
  const [inquiryLoading, setInquiryLoading] = useState(false);

  const loadInquiries = useCallback(async () => {
    setInquiryLoading(true);
    try {
      const res = await fetchPlanInquiries({ size: 50 });
      setInquiries(res.items);
    } catch {
      /* ignore */
    } finally {
      setInquiryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInquiries();
  }, [loadInquiries]);

  const handleCompleteInquiry = async (id: string) => {
    if (!confirm('이 문의를 처리 완료로 변경하시겠습니까?')) return;
    try {
      await updatePlanInquiryStatus(id, 'completed');
      void loadInquiries();
    } catch {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleToggleActive = async (item: ApiKeyItem) => {
    const action = item.is_active ? '비활성화' : '활성화';
    if (!confirm(`${item.client_name}를 ${action}하시겠습니까?`)) return;
    try {
      const updated = await updateSaasKey(item.id, {
        is_active: !item.is_active,
      });
      setKeys((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
      void loadStats();
    } catch {
      alert(`${action}에 실패했습니다.`);
    }
  };

  const pendingCount = inquiries.filter((i) => i.status === 'pending').length;

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SaaS API 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            파트너사 API 키 발급, 관리 및 사용량 모니터링
          </p>
        </div>
        {activeTab === 'keys' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={16} />새 키 발급
          </button>
        )}
      </div>

      {/* 매뉴얼 */}
      <details className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          📖 SaaS API 관리 매뉴얼
        </summary>
        <div className="space-y-4 border-t px-5 py-4 text-sm text-gray-600">
          <details className="rounded border border-gray-100 bg-gray-50">
            <summary className="cursor-pointer px-4 py-2 font-medium text-gray-700 hover:bg-gray-100">
              🔑 API 키 발급 방법
            </summary>
            <div className="px-4 py-3">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>새 키 발급</strong> 버튼을 클릭하여 파트너사 정보를
                  입력합니다.
                </li>
                <li>
                  <strong>파트너명</strong>: 회사 또는 서비스 이름을 입력합니다.
                </li>
                <li>
                  <strong>플랜 선택</strong>: Free / Basic / Pro / Enterprise 중
                  선택합니다.
                </li>
                <li>
                  발급 완료 시 <strong>API Key</strong>와{' '}
                  <strong>Secret Key</strong>가 생성됩니다.
                </li>
              </ul>
            </div>
          </details>

          <details className="rounded border border-gray-100 bg-gray-50">
            <summary className="cursor-pointer px-4 py-2 font-medium text-gray-700 hover:bg-gray-100">
              ⚙️ API 키 관리
            </summary>
            <div className="px-4 py-3">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>해당 키 관리(🔑)</strong>: 키 버튼을 클릭시 회사명,
                  도메인, 플랜, 활성 상태을 변경 할 수 있습니다.
                </li>
                <li>
                  <strong>Secret Key 재발급(↩️)</strong>: 키 유출 시 Secret
                  Key만 재발급할 수 있습니다. 기존 Secret Key는 즉시
                  무효화됩니다.
                </li>
                <li>
                  <strong>사용량 초기화(🔄)</strong>: 사용량을 초기화 합니다.
                </li>
                <li>
                  <strong>로그 확인(🔍)</strong>: 로그를 확인할 수 있습니다.
                </li>
              </ul>
            </div>
          </details>

          <details className="rounded border border-gray-100 bg-gray-50">
            <summary className="cursor-pointer px-4 py-2 font-medium text-gray-700 hover:bg-gray-100">
              📊 플랜별 한도
            </summary>
            <div className="px-4 py-3">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Free</strong>: 일 1,000회 / 월 10,000회 — 테스트 및
                  개발용
                </li>
                <li>
                  <strong>Basic</strong>: 일 10,000회 / 월 100,000회 — 소규모
                  서비스
                </li>
                <li>
                  <strong>Pro</strong>: 일 100,000회 / 월 1,000,000회 — 중규모
                  서비스
                </li>
                <li>
                  <strong>Enterprise</strong>: 무제한 — 대규모 서비스 (별도
                  협의)
                </li>
                <li>
                  한도 초과 시 API 응답에{' '}
                  <code className="rounded bg-gray-200 px-1">
                    429 Too Many Requests
                  </code>
                  가 반환됩니다.
                </li>
              </ul>
            </div>
          </details>

          <details className="rounded border border-gray-100 bg-gray-50">
            <summary className="cursor-pointer px-4 py-2 font-medium text-gray-700 hover:bg-gray-100">
              📬 플랜 업그레이드 문의 관리
            </summary>
            <div className="px-4 py-3">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>플랜 업그레이드 문의</strong> 탭에서 파트너사의 SaaS
                  플랜 업그레이드 문의를 확인할 수 있습니다.
                </li>
                <li>
                  문의 상태: <strong>대기중</strong>(pending) →{' '}
                  <strong>검토중</strong>(reviewing) → <strong>완료</strong>
                  (resolved)
                </li>
                <li>상태 변경 시 해당 파트너사에 이메일 알림이 발송됩니다.</li>
                <li>
                  문의 내용을 검토한 후 적절한 플랜의 API 키를 발급해 주세요.
                </li>
              </ul>
            </div>
          </details>
        </div>
      </details>

      {/* 탭 */}
      <div className="mb-6 flex border-b">
        <button
          onClick={() => setActiveTab('keys')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'keys'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          API 키 관리
        </button>
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'inquiries'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          플랜 업그레이드 문의
          {pendingCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'keys' && (
        <>
          {/* 통계 카드 */}
          <StatsCards stats={stats} />

          {/* 검색 */}
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none"
                placeholder="파트너사명 또는 API 키로 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-50"
            >
              검색
            </button>
            <button
              onClick={() => {
                void loadKeys();
                void loadStats();
              }}
              className="rounded-lg border bg-white px-3 py-2 text-gray-500 hover:bg-gray-50"
              title="새로고침"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* 키 목록 테이블 */}
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-sm text-gray-400">
                로딩 중...
              </div>
            ) : keys.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">
                등록된 API 키가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-3">파트너사</th>
                      <th className="px-4 py-3">Site Key</th>
                      <th className="px-4 py-3">Secret Key</th>
                      <th className="px-4 py-3">플랜</th>
                      <th className="px-4 py-3">사용량</th>
                      <th className="px-4 py-3">상태</th>
                      <th className="px-4 py-3">생성일</th>
                      <th className="px-4 py-3">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((item) => {
                      const usagePercent =
                        item.monthly_limit > 0
                          ? Math.round(
                              (item.current_month_usage / item.monthly_limit) *
                                100,
                            )
                          : 0;
                      const secretVisible = showSecrets[item.id];

                      return (
                        <tr
                          key={item.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-medium">
                            {item.client_name}
                            {item.allowed_domains &&
                              item.allowed_domains.length > 0 && (
                                <p className="mt-0.5 text-xs text-gray-400">
                                  {item.allowed_domains.join(', ')}
                                </p>
                              )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <code className="text-xs">
                                {maskKey(item.api_key)}
                              </code>
                              <button
                                onClick={() => copyToClipboard(item.api_key)}
                                className="text-gray-400 hover:text-blue-600"
                                title="복사"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <code className="text-xs">
                                {secretVisible
                                  ? item.secret_key
                                  : maskKey(item.secret_key)}
                              </code>
                              <button
                                onClick={() =>
                                  setShowSecrets((prev) => ({
                                    ...prev,
                                    [item.id]: !prev[item.id],
                                  }))
                                }
                                className="text-gray-400 hover:text-gray-600"
                                title={secretVisible ? '숨기기' : '보기'}
                              >
                                {secretVisible ? (
                                  <EyeOff size={14} />
                                ) : (
                                  <Eye size={14} />
                                )}
                              </button>
                              {secretVisible && (
                                <button
                                  onClick={() =>
                                    copyToClipboard(item.secret_key)
                                  }
                                  className="text-gray-400 hover:text-blue-600"
                                  title="복사"
                                >
                                  <Copy size={14} />
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${planColor(item.plan)}`}
                            >
                              {planLabel(item.plan)}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="w-28">
                              <div className="flex justify-between text-xs">
                                <span>
                                  {item.current_month_usage.toLocaleString()}
                                </span>
                                <span className="text-gray-400">
                                  / {item.monthly_limit.toLocaleString()}
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    usagePercent >= 90
                                      ? 'bg-red-500'
                                      : usagePercent >= 70
                                        ? 'bg-amber-400'
                                        : 'bg-green-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(usagePercent, 100)}%`,
                                  }}
                                />
                              </div>
                              <p className="mt-0.5 text-right text-xs text-gray-400">
                                {usagePercent}%
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleActive(item)}
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                item.is_active
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {item.is_active ? '활성' : '비활성'}
                            </button>
                          </td>

                          <td className="px-4 py-3 text-xs text-gray-500">
                            {item.created_at?.split(' ')[0] ?? '-'}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditKey(item)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                                title="수정"
                              >
                                <Key size={14} />
                              </button>
                              <button
                                onClick={() => handleRotateSecret(item)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-amber-600"
                                title="Secret 재발급"
                              >
                                <RotateCcw size={14} />
                              </button>
                              <button
                                onClick={() => handleResetUsage(item)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-purple-600"
                                title="사용량 초기화"
                              >
                                <RefreshCw size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  setLogKey({
                                    id: item.id,
                                    name: item.client_name,
                                  })
                                }
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-green-600"
                                title="사용 로그"
                              >
                                <Search size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 페이징 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-xs text-gray-500">
                  총 {total}건 중 {(page - 1) * 20 + 1}–
                  {Math.min(page * 20, total)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                  >
                    이전
                  </button>
                  <span className="text-xs text-gray-500">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 플랜 문의 탭 */}
      {activeTab === 'inquiries' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              플랜 업그레이드 문의
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  {pendingCount}건 대기
                </span>
              )}
            </h2>
            <button
              onClick={() => void loadInquiries()}
              className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200"
            >
              <RefreshCw size={12} />
              새로고침
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            {inquiryLoading ? (
              <div className="p-12 text-center text-sm text-gray-400">
                로딩 중...
              </div>
            ) : inquiries.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">
                접수된 문의가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-3">사용자</th>
                      <th className="px-4 py-3">희망 플랜</th>
                      <th className="px-4 py-3">메시지</th>
                      <th className="px-4 py-3">상태</th>
                      <th className="px-4 py-3">일시</th>
                      <th className="px-4 py-3">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((inq) => (
                      <tr
                        key={inq.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-4 font-medium text-gray-700">
                          {inq.user_email || inq.user_id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${planColor(inq.desired_plan)}`}
                          >
                            {planLabel(inq.desired_plan)}
                          </span>
                        </td>
                        <td className="max-w-[300px] truncate px-4 py-4 text-gray-500">
                          {inq.message || '-'}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              inq.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {inq.status === 'pending' ? '대기' : '완료'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-500">
                          {inq.created_at?.slice(0, 10) || '-'}
                        </td>
                        <td className="px-4 py-4">
                          {inq.status === 'pending' && (
                            <button
                              onClick={() => handleCompleteInquiry(inq.id)}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                            >
                              처리 완료
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* 모달들 */}
      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={(key) => {
            setShowCreate(false);
            setCreatedKey(key);
            void loadKeys();
            void loadStats();
          }}
        />
      )}

      {createdKey && (
        <KeyCreatedModal
          item={createdKey}
          onClose={() => setCreatedKey(null)}
        />
      )}

      {editKey && (
        <EditKeyModal
          item={editKey}
          onClose={() => setEditKey(null)}
          onUpdated={(updated) => {
            setKeys((prev) =>
              prev.map((k) => (k.id === updated.id ? updated : k)),
            );
            setEditKey(null);
            void loadStats();
          }}
        />
      )}

      {logKey && (
        <UsageLogModal
          keyId={logKey.id}
          clientName={logKey.name}
          onClose={() => setLogKey(null)}
        />
      )}
    </div>
  );
}
