import { useCallback, useEffect, useState } from 'react';
import { Copy, Eye, EyeOff, MessageSquare, Plus, RefreshCw, Trash2, X } from 'lucide-react';

import {
  fetchMyV2Keys,
  createMyV2Key,
  updateMyV2Key,
  deleteMyV2Key,
  rotateMyV2Secret,
  fetchMyV2UsageLogs,
  fetchMyV2UsageSummary,
  type SaasKeyItem,
  type UsageLogItem,
  type UsageSummary,
} from '../../apis/developerV2';
import { usePageTitle } from '../../hooks/usePageTitle';

type ModalState = { type: 'create' | 'rotate' | 'edit' | null; keyId?: string };

function maskKey(key: string) {
  return key.length <= 12 ? '••••••••' : key.slice(0, 12) + '••••••••';
}

function copy(text: string) {
  navigator.clipboard.writeText(text);
}

export default function MyDeveloperChat() {
  usePageTitle('채팅 AI SaaS');

  const [keys, setKeys] = useState<SaasKeyItem[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [logs, setLogs] = useState<Record<string, UsageLogItem[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [createdKey, setCreatedKey] = useState<SaasKeyItem | null>(null);
  const [rotatedKey, setRotatedKey] = useState<SaasKeyItem | null>(null);
  const [createForm, setCreateForm] = useState({ client_name: '', allowed_domains: '' });
  const [editForm, setEditForm] = useState({ client_name: '', allowed_domains: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [keysData, summaryData] = await Promise.all([
        fetchMyV2Keys({ service_type: 'chat_filter' }),
        fetchMyV2UsageSummary('chat_filter'),
      ]);
      setKeys(keysData.items);
      setSummary(summaryData);
    } catch {
      setError('데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadLogs = useCallback(async (keyId: string) => {
    try {
      const data = await fetchMyV2UsageLogs(keyId, { page: 1, size: 20 });
      setLogs((prev) => ({ ...prev, [keyId]: data.items }));
    } catch { /* silent */ }
  }, []);

  const toggleExpand = (keyId: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [keyId]: !prev[keyId] };
      if (next[keyId] && !logs[keyId]) loadLogs(keyId);
      return next;
    });
  };

  const toggleSecret = (keyId: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.client_name.trim()) { setError('서비스명을 입력해주세요.'); return; }
    try {
      const result = await createMyV2Key({
        service_type: 'chat_filter',
        client_name: createForm.client_name.trim(),
        allowed_domains: createForm.allowed_domains.trim()
          ? createForm.allowed_domains.split(',').map((d) => d.trim()).filter(Boolean)
          : undefined,
      });
      setCreatedKey(result);
      setCreateForm({ client_name: '', allowed_domains: '' });
      setModal({ type: 'create' });
      await load();
    } catch (err) {
      setError((err as Error).message || '키 생성 실패');
    }
  }, [createForm, load]);

  const handleEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal.keyId) return;
    try {
      await updateMyV2Key(modal.keyId, {
        client_name: editForm.client_name.trim(),
        allowed_domains: editForm.allowed_domains.trim()
          ? editForm.allowed_domains.split(',').map((d) => d.trim()).filter(Boolean)
          : [],
      });
      setModal({ type: null });
      await load();
    } catch (err) {
      setError((err as Error).message || '수정 실패');
    }
  }, [modal.keyId, editForm, load]);

  const handleRotate = useCallback(async (keyId: string) => {
    if (!window.confirm('기존 Secret Key는 즉시 무효화됩니다. 계속하시겠습니까?')) return;
    try {
      const result = await rotateMyV2Secret(keyId);
      setRotatedKey(result);
      setModal({ type: 'rotate' });
      await load();
    } catch (err) {
      setError((err as Error).message || 'Secret Key 재발급 실패');
    }
  }, [load]);

  const handleDelete = useCallback(async (keyId: string, name: string) => {
    if (!window.confirm(`"${name}" 키를 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) return;
    try {
      await deleteMyV2Key(keyId);
      await load();
    } catch (err) {
      setError((err as Error).message || '삭제 실패');
    }
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">채팅 AI SaaS</h1>
            <p className="text-sm text-gray-500">Ollama LLM 기반 욕설 / 비매너 실시간 탐지 API</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* 요약 카드 */}
        {summary && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '전체 키', value: summary.total_keys },
              { label: '활성 키', value: summary.active_keys },
              { label: '이번 달 사용', value: summary.total_usage_this_month.toLocaleString() },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* 안내 배너 */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-medium">채팅 AI API 사용 안내</p>
          <p className="mt-0.5 text-xs text-emerald-700">
            POST /api/saas/chat/filter — <code className="rounded bg-emerald-100 px-1">{"{ text: string }"}</code> 전송 시 욕설 탐지 결과 및 순화 텍스트 반환
          </p>
        </div>

        {/* 키 발급 폼 */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">새 API 키 발급</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row">
            <input
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="서비스명 (예: MyChatApp)"
              value={createForm.client_name}
              onChange={(e) => setCreateForm((p) => ({ ...p, client_name: e.target.value }))}
            />
            <input
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="허용 도메인 (콤마 구분, 생략 시 전체)"
              value={createForm.allowed_domains}
              onChange={(e) => setCreateForm((p) => ({ ...p, allowed_domains: e.target.value }))}
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" /> 발급
            </button>
          </form>
          <p className="mt-2 text-xs text-gray-400">서비스당 최대 3개 발급 가능 · Free 플랜: 월 10,000 요청</p>
        </div>

        {/* 키 목록 */}
        <div className="space-y-3">
          {loading && <p className="text-center text-sm text-gray-400">불러오는 중...</p>}
          {!loading && keys.length === 0 && (
            <div className="rounded-xl border bg-white py-12 text-center text-sm text-gray-400">
              발급된 API 키가 없습니다.
            </div>
          )}
          {keys.map((key) => (
            <div key={key.id} className="rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{key.client_name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${key.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {key.is_active ? '활성' : '비활성'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-xs text-gray-500">{maskKey(key.api_key)}</code>
                    <button onClick={() => copy(key.api_key)} className="text-gray-400 hover:text-gray-600">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {key.current_month_usage.toLocaleString()} / {key.monthly_limit.toLocaleString()} 요청
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditForm({ client_name: key.client_name, allowed_domains: key.allowed_domains?.join(', ') || '' }); setModal({ type: 'edit', keyId: key.id }); }}
                    className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50"
                  >수정</button>
                  <button onClick={() => handleRotate(key.id)} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(key.id, key.client_name)} className="rounded-lg border px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => toggleExpand(key.id)} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50">
                    {expanded[key.id] ? '접기' : '로그'}
                  </button>
                </div>
              </div>

              {/* Secret Key */}
              <div className="border-t bg-gray-50 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Secret:</span>
                  <code className="text-xs text-gray-600">
                    {visibleSecrets[key.id] ? key.secret_key : maskKey(key.secret_key)}
                  </code>
                  <button onClick={() => toggleSecret(key.id)} className="text-gray-400 hover:text-gray-600">
                    {visibleSecrets[key.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => copy(key.secret_key)} className="text-gray-400 hover:text-gray-600">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 사용 로그 */}
              {expanded[key.id] && (
                <div className="border-t px-5 py-3">
                  <p className="mb-2 text-xs font-medium text-gray-500">최근 사용 로그</p>
                  {!logs[key.id] ? (
                    <p className="text-xs text-gray-400">불러오는 중...</p>
                  ) : logs[key.id].length === 0 ? (
                    <p className="text-xs text-gray-400">사용 내역이 없습니다.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-400">
                            <th className="pb-1 pr-4">엔드포인트</th>
                            <th className="pb-1 pr-4">상태</th>
                            <th className="pb-1">시각</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs[key.id].map((log) => (
                            <tr key={log.id} className="border-t border-gray-100">
                              <td className="py-1 pr-4 text-gray-600">{log.endpoint}</td>
                              <td className={`py-1 pr-4 font-medium ${log.status_code === 200 ? 'text-green-600' : 'text-red-500'}`}>{log.status_code}</td>
                              <td className="py-1 text-gray-400">{log.created_at}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 발급 완료 모달 */}
      {modal.type === 'create' && createdKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-bold text-gray-900">API 키 발급 완료</h3>
            <p className="mb-4 text-sm text-amber-600">Secret Key는 지금만 확인할 수 있습니다. 반드시 복사해두세요.</p>
            <div className="space-y-3">
              {[['API Key', createdKey.api_key], ['Secret Key', createdKey.secret_key]].map(([label, val]) => (
                <div key={label}>
                  <p className="mb-1 text-xs text-gray-500">{label}</p>
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <code className="flex-1 break-all text-xs text-gray-700">{val}</code>
                    <button onClick={() => copy(val)}><Copy className="h-4 w-4 text-gray-400" /></button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setModal({ type: null }); setCreatedKey(null); }}
              className="mt-4 w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >확인</button>
          </div>
        </div>
      )}

      {/* 재발급 완료 모달 */}
      {modal.type === 'rotate' && rotatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-bold text-gray-900">Secret Key 재발급 완료</h3>
            <p className="mb-4 text-sm text-amber-600">기존 Secret Key는 무효화되었습니다. 새 키를 복사해두세요.</p>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all text-xs text-gray-700">{rotatedKey.secret_key}</code>
                <button onClick={() => copy(rotatedKey.secret_key)}><Copy className="h-4 w-4 text-gray-400" /></button>
              </div>
            </div>
            <button
              onClick={() => { setModal({ type: null }); setRotatedKey(null); }}
              className="mt-4 w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >확인</button>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {modal.type === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">API 키 수정</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">서비스명</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={editForm.client_name}
                  onChange={(e) => setEditForm((p) => ({ ...p, client_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">허용 도메인 (콤마 구분)</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={editForm.allowed_domains}
                  onChange={(e) => setEditForm((p) => ({ ...p, allowed_domains: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal({ type: null })} className="flex-1 rounded-lg border py-2 text-sm hover:bg-gray-50">취소</button>
                <button type="submit" className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
