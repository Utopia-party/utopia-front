import { useCallback, useEffect, useState } from 'react';
import {
  Copy, Eye, EyeOff, Key, MessageSquare,
  Plus, RefreshCw, Search, X,
} from 'lucide-react';
import {
  fetchSaasV2Keys,
  createSaasV2Key,
  updateSaasV2Key,
  rotateSaasV2Secret,
  resetSaasV2Usage,
  fetchSaasV2Logs,
  fetchSaasV2Stats,
  fetchSaasV2PlanInquiries,
  updateSaasV2PlanInquiryStatus,
  type SaasKeyItem,
  type UsageLogItem,
  type SaasStats,
  type ServiceType,
  type PlanInquiryItem,
} from '../../apis/admin/adminSaasV2';

type Tab = 'captcha_l2' | 'chat_filter';
type PageTab = 'keys' | 'inquiries';
type ModalState = { type: 'create' | 'edit' | 'rotate' | 'logs' | null; keyId?: string };

function maskKey(key: string) {
  return key.length <= 12 ? '••••••••' : key.slice(0, 12) + '••••••••';
}

function copy(text: string) { navigator.clipboard.writeText(text); }

function planColor(plan: string) {
  const map: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    starter: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  };
  return map[plan] ?? 'bg-gray-100 text-gray-700';
}

export default function AdminSaasV2() {
  const [tab, setTab] = useState<Tab>('captcha_l2');
  const [pageTab, setPageTab] = useState<PageTab>('keys');
  const [keys, setKeys] = useState<SaasKeyItem[]>([]);
  const [stats, setStats] = useState<SaasStats | null>(null);
  const [inquiries, setInquiries] = useState<PlanInquiryItem[]>([]);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [logs, setLogs] = useState<UsageLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  const [createForm, setCreateForm] = useState({
    client_name: '', allowed_domains: '', monthly_limit: '10000', plan: 'free',
  });
  const [editForm, setEditForm] = useState({
    client_name: '', allowed_domains: '', monthly_limit: '', plan: '', is_active: true,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [keysData, statsData] = await Promise.all([
        fetchSaasV2Keys({ service_type: tab, search: search || undefined, is_active: filterActive }),
        fetchSaasV2Stats(tab),
      ]);
      setKeys(keysData.items);
      setTotal(keysData.total);
      setStats(statsData);
    } catch {
      setError('데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [tab, search, filterActive]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadInquiries = useCallback(async () => {
    setInquiryLoading(true);
    try {
      const res = await fetchSaasV2PlanInquiries({ service_type: tab, size: 50 });
      setInquiries(res.items);
    } catch { /* ignore */ } finally {
      setInquiryLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadInquiries(); }, [loadInquiries]);

  const handleCompleteInquiry = useCallback(async (id: string) => {
    if (!window.confirm('이 문의를 처리 완료로 변경하시겠습니까?')) return;
    try {
      await updateSaasV2PlanInquiryStatus(id, 'completed');
      void loadInquiries();
    } catch { alert('상태 변경에 실패했습니다.'); }
  }, [loadInquiries]);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSaasV2Key({
        service_type: tab as ServiceType,
        client_name: createForm.client_name.trim(),
        allowed_domains: createForm.allowed_domains.trim()
          ? createForm.allowed_domains.split(',').map((d) => d.trim()).filter(Boolean)
          : undefined,
        monthly_limit: parseInt(createForm.monthly_limit) || 10000,
        plan: createForm.plan,
      });
      setModal({ type: null });
      setCreateForm({ client_name: '', allowed_domains: '', monthly_limit: '10000', plan: 'free' });
      await loadAll();
    } catch (err) { setError((err as Error).message); }
  }, [tab, createForm, loadAll]);

  const openEdit = (key: SaasKeyItem) => {
    setEditForm({
      client_name: key.client_name,
      allowed_domains: key.allowed_domains?.join(', ') || '',
      monthly_limit: String(key.monthly_limit),
      plan: key.plan,
      is_active: key.is_active,
    });
    setModal({ type: 'edit', keyId: key.id });
  };

  const handleEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal.keyId) return;
    try {
      await updateSaasV2Key(modal.keyId, {
        client_name: editForm.client_name.trim(),
        allowed_domains: editForm.allowed_domains.trim()
          ? editForm.allowed_domains.split(',').map((d) => d.trim()).filter(Boolean)
          : [],
        monthly_limit: parseInt(editForm.monthly_limit) || undefined,
        plan: editForm.plan,
        is_active: editForm.is_active,
      });
      setModal({ type: null });
      await loadAll();
    } catch (err) { setError((err as Error).message); }
  }, [modal.keyId, editForm, loadAll]);

  const handleRotate = useCallback(async (keyId: string) => {
    if (!window.confirm('Secret Key를 재발급하시겠습니까?')) return;
    try {
      const result = await rotateSaasV2Secret(keyId);
      setRotatedSecret(result.secret_key);
      setModal({ type: 'rotate' });
      await loadAll();
    } catch (err) { setError((err as Error).message); }
  }, [loadAll]);

  const handleResetUsage = useCallback(async (keyId: string) => {
    if (!window.confirm('사용량을 초기화하시겠습니까?')) return;
    try {
      await resetSaasV2Usage(keyId);
      await loadAll();
    } catch (err) { setError((err as Error).message); }
  }, [loadAll]);

  const openLogs = useCallback(async (keyId: string) => {
    try {
      const data = await fetchSaasV2Logs(keyId, { page: 1, size: 50 });
      setLogs(data.items);
      setModal({ type: 'logs', keyId });
    } catch (err) { setError((err as Error).message); }
  }, []);

  const tabConfig = {
    captcha_l2: { label: '캡챠 SaaS (L2)', color: 'violet', icon: Key },
    chat_filter: { label: '채팅 AI SaaS', color: 'emerald', icon: MessageSquare },
  };
  const cur = tabConfig[tab];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* 서비스 탭 */}
        <div className="flex gap-2">
          {(Object.entries(tabConfig) as [Tab, typeof tabConfig[Tab]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  tab === key
                    ? key === 'captcha_l2' ? 'bg-violet-600 text-white' : 'bg-emerald-600 text-white'
                    : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* 키관리 / 플랜문의 탭 */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setPageTab('keys')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              pageTab === 'keys' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            API 키 관리
          </button>
          <button
            onClick={() => setPageTab('inquiries')}
            className={`relative px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              pageTab === 'inquiries' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            플랜 업그레이드 문의
            {inquiries.filter((i) => i.status === 'pending').length > 0 && (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                {inquiries.filter((i) => i.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* 키 관리 섹션 */}
        {pageTab === 'keys' && (<>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: '전체 키', value: stats.total_keys },
              { label: '활성 키', value: stats.active_keys },
              { label: '비활성 키', value: stats.total_keys - stats.active_keys },
              { label: '이번 달 총 사용', value: stats.total_usage_this_month.toLocaleString() },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* 검색 + 발급 */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="서비스명 또는 API 키 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none"
            value={filterActive === undefined ? '' : String(filterActive)}
            onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')}
          >
            <option value="">전체</option>
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
          <button
            onClick={() => setModal({ type: 'create' })}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${
              tab === 'captcha_l2' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Plus className="h-4 w-4" /> 키 발급
          </button>
        </div>

        {/* 키 목록 */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">서비스명</th>
                  <th className="px-4 py-3 text-left">API Key</th>
                  <th className="px-4 py-3 text-left">Secret Key</th>
                  <th className="px-4 py-3 text-left">플랜</th>
                  <th className="px-4 py-3 text-left">사용량</th>
                  <th className="px-4 py-3 text-left">상태</th>
                  <th className="px-4 py-3 text-left">생성일</th>
                  <th className="px-4 py-3 text-left">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-400">불러오는 중...</td></tr>
                )}
                {!loading && keys.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-400">데이터가 없습니다.</td></tr>
                )}
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{key.client_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <code className="text-xs text-gray-500">{maskKey(key.api_key)}</code>
                        <button onClick={() => copy(key.api_key)} className="text-gray-400 hover:text-gray-600">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <code className="text-xs text-gray-500">
                          {visibleSecrets[key.id] ? key.secret_key : maskKey(key.secret_key)}
                        </code>
                        <button onClick={() => setVisibleSecrets((p) => ({ ...p, [key.id]: !p[key.id] }))} className="text-gray-400 hover:text-gray-600">
                          {visibleSecrets[key.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => copy(key.secret_key)} className="text-gray-400 hover:text-gray-600">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${planColor(key.plan)}`}>
                        {key.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {key.current_month_usage.toLocaleString()} / {key.monthly_limit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${key.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {key.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{key.created_at?.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(key)} className="rounded px-2 py-1 text-xs border hover:bg-gray-50">수정</button>
                        <button onClick={() => handleRotate(key.id)} className="rounded px-2 py-1 text-xs border hover:bg-gray-50">재발급</button>
                        <button onClick={() => handleResetUsage(key.id)} className="rounded px-2 py-1 text-xs border hover:bg-gray-50">초기화</button>
                        <button onClick={() => openLogs(key.id)} className="rounded px-2 py-1 text-xs border hover:bg-gray-50">로그</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t px-4 py-2 text-xs text-gray-400">총 {total}개</div>
        </div>

        </>)} {/* end pageTab === 'keys' */}

        {/* 플랜 문의 섹션 */}
        {pageTab === 'inquiries' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                플랜 업그레이드 문의
                {inquiries.filter((i) => i.status === 'pending').length > 0 && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    {inquiries.filter((i) => i.status === 'pending').length}건 대기
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
                <div className="p-12 text-center text-sm text-gray-400">로딩 중...</div>
              ) : inquiries.length === 0 ? (
                <div className="p-12 text-center text-sm text-gray-400">접수된 문의가 없습니다.</div>
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
                        <tr key={inq.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-4 font-medium text-gray-700">
                            {inq.user_email || inq.user_id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${planColor(inq.desired_plan)}`}>
                              {inq.desired_plan}
                            </span>
                          </td>
                          <td className="max-w-[300px] truncate px-4 py-4 text-gray-500">
                            {inq.message || '-'}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              inq.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {inq.status === 'pending' ? '대기' : '완료'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-500">{inq.created_at?.slice(0, 10) || '-'}</td>
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
          </div>
        )}
      </div>

      {/* 발급 모달 */}
      {modal.type === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">{cur.label} 키 발급</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">서비스명 *</label>
                <input className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  value={createForm.client_name} onChange={(e) => setCreateForm((p) => ({ ...p, client_name: e.target.value }))} required />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">허용 도메인 (콤마 구분)</label>
                <input className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  value={createForm.allowed_domains} onChange={(e) => setCreateForm((p) => ({ ...p, allowed_domains: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">월 한도</label>
                  <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    value={createForm.monthly_limit} onChange={(e) => setCreateForm((p) => ({ ...p, monthly_limit: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">플랜</label>
                  <select className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                    value={createForm.plan} onChange={(e) => setCreateForm((p) => ({ ...p, plan: e.target.value }))}>
                    {['free', 'starter', 'pro', 'enterprise'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal({ type: null })} className="flex-1 rounded-lg border py-2 text-sm hover:bg-gray-50">취소</button>
                <button type="submit" className={`flex-1 rounded-lg py-2 text-sm font-medium text-white ${tab === 'captcha_l2' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>발급</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {modal.type === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">API 키 수정</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">서비스명</label>
                <input className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  value={editForm.client_name} onChange={(e) => setEditForm((p) => ({ ...p, client_name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">허용 도메인</label>
                <input className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  value={editForm.allowed_domains} onChange={(e) => setEditForm((p) => ({ ...p, allowed_domains: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">월 한도</label>
                  <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    value={editForm.monthly_limit} onChange={(e) => setEditForm((p) => ({ ...p, monthly_limit: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">플랜</label>
                  <select className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                    value={editForm.plan} onChange={(e) => setEditForm((p) => ({ ...p, plan: e.target.value }))}>
                    {['free', 'starter', 'pro', 'enterprise'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={editForm.is_active}
                  onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.checked }))} />
                <label htmlFor="is_active" className="text-sm text-gray-700">활성화</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal({ type: null })} className="flex-1 rounded-lg border py-2 text-sm hover:bg-gray-50">취소</button>
                <button type="submit" className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 재발급 완료 모달 */}
      {modal.type === 'rotate' && rotatedSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-bold">Secret Key 재발급 완료</h3>
            <p className="mb-4 text-sm text-amber-600">기존 키는 즉시 무효화되었습니다.</p>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <code className="flex-1 break-all text-xs">{rotatedSecret}</code>
              <button onClick={() => copy(rotatedSecret)}><Copy className="h-4 w-4 text-gray-400" /></button>
            </div>
            <button onClick={() => { setModal({ type: null }); setRotatedSecret(null); }}
              className="mt-4 w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700">확인</button>
          </div>
        </div>
      )}

      {/* 로그 모달 */}
      {modal.type === 'logs' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">사용 로그</h3>
              <button onClick={() => setModal({ type: null })}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">사용 내역이 없습니다.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white text-left text-gray-400">
                    <tr>
                      <th className="pb-2 pr-4">엔드포인트</th>
                      <th className="pb-2 pr-4">상태</th>
                      <th className="pb-2 pr-4">응답(ms)</th>
                      <th className="pb-2">시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t">
                        <td className="py-1.5 pr-4 text-gray-600">{log.endpoint}</td>
                        <td className={`py-1.5 pr-4 font-medium ${log.status_code === 200 ? 'text-green-600' : 'text-red-500'}`}>{log.status_code}</td>
                        <td className="py-1.5 pr-4 text-gray-500">{log.response_time_ms}</td>
                        <td className="py-1.5 text-gray-400">{log.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
