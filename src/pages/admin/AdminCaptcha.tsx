import { useCallback, useEffect, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import {
  fetchShadowMode,
  toggleShadowMode,
  fetchBlockedIps,
  unblockIp,
  unblockAllIps,
  fetchCaptchaConfig,
  updateCaptchaConfig,
  forceChallenge,
  type ShadowModeResponse,
  type BlockedIpEntry,
  type CaptchaConfigResponse,
} from '../../apis/admin';

function formatTtl(seconds: number): string {
  if (seconds < 0) return '만료됨';
  if (seconds < 60) return `${seconds}초`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)}시간 ${Math.floor((seconds % 3600) / 60)}분`;
  return `${Math.floor(seconds / 86400)}일`;
}

export default function AdminCaptcha() {
  // ── LSTM Shadow Mode ──
  const [shadowData, setShadowData] = useState<ShadowModeResponse | null>(null);
  const [shadowToggling, setShadowToggling] = useState(false);

  const loadShadowMode = useCallback(async () => {
    try {
      const data = await fetchShadowMode();
      setShadowData(data);
    } catch {
      // 조회 실패 시 무시
    }
  }, []);

  // ── 캡챠 수치 설정 (handleShadowToggle보다 먼저 선언) ──
  const [config, setConfig] = useState<CaptchaConfigResponse | null>(null);
  const [configDraft, setConfigDraft] = useState<{
    lstm_weight: string;
    knn_weight: string;
    pass_threshold: string;
    challenge_threshold: string;
  }>({
    lstm_weight: '',
    knn_weight: '',
    pass_threshold: '',
    challenge_threshold: '',
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState('');

  const loadConfig = useCallback(async () => {
    try {
      const data = await fetchCaptchaConfig();
      setConfig(data);
      setConfigDraft({
        lstm_weight: String(data.lstm_weight),
        knn_weight: String(data.knn_weight),
        pass_threshold: String(data.pass_threshold),
        challenge_threshold: String(data.challenge_threshold),
      });
    } catch {
      // ignore
    }
  }, []);

  const handleShadowToggle = useCallback(async () => {
    setShadowToggling(true);
    try {
      const data = await toggleShadowMode();
      setShadowData(data);
      await loadConfig();
    } catch {
      await loadShadowMode();
    } finally {
      setShadowToggling(false);
    }
  }, [loadShadowMode, loadConfig]);

  const handleConfigSave = useCallback(async () => {
    setConfigSaving(true);
    setConfigMsg('');
    try {
      const data = await updateCaptchaConfig({
        lstm_weight: parseFloat(configDraft.lstm_weight),
        knn_weight: parseFloat(configDraft.knn_weight),
        pass_threshold: parseFloat(configDraft.pass_threshold),
        challenge_threshold: parseFloat(configDraft.challenge_threshold),
      });
      setConfig(data);
      setConfigDraft({
        lstm_weight: String(data.lstm_weight),
        knn_weight: String(data.knn_weight),
        pass_threshold: String(data.pass_threshold),
        challenge_threshold: String(data.challenge_threshold),
      });
      setConfigMsg(data.message || '저장 완료');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setConfigMsg(apiErr.response?.data?.detail || '저장 실패');
    } finally {
      setConfigSaving(false);
    }
  }, [configDraft]);

  // ── IP 제재 관리 ──
  const [blockedIps, setBlockedIps] = useState<BlockedIpEntry[]>([]);
  const [blockedTotal, setBlockedTotal] = useState(0);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const loadBlockedIps = useCallback(async () => {
    setBlockedLoading(true);
    try {
      const data = await fetchBlockedIps();
      setBlockedIps(data.blocked_ips);
      setBlockedTotal(data.total);
    } catch {
      // 조회 실패 시 무시
    } finally {
      setBlockedLoading(false);
    }
  }, []);

  const handleUnblock = useCallback(
    async (ip: string) => {
      if (!confirm(`${ip}의 제재를 해제하시겠습니까?`)) return;
      setUnblocking(ip);
      try {
        await unblockIp(ip);
        await loadBlockedIps();
      } catch {
        // 실패 시 무시
      } finally {
        setUnblocking(null);
      }
    },
    [loadBlockedIps],
  );

  const handleUnblockAll = useCallback(async () => {
    if (!confirm('모든 IP의 캡챠 제재를 해제하시겠습니까?')) return;
    setUnblocking('all');
    try {
      await unblockAllIps();
      await loadBlockedIps();
    } catch {
      // 실패 시 무시
    } finally {
      setUnblocking(null);
    }
  }, [loadBlockedIps]);

  useEffect(() => {
    loadShadowMode();
    loadBlockedIps();
    loadConfig();
  }, [loadShadowMode, loadBlockedIps, loadConfig]);

  return (
    <>
      <AdminHeader placeholder="캡챠 설정 검색..." />

      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">캡챠 관리</h1>
          <p className="mt-1 text-sm text-slate-500">
            캡챠 시스템 설정, 모니터링, 세션 관리
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* ── LSTM Shadow Mode 토글 카드 ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 text-sm font-bold">
                AI
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                LSTM 모델 설정
              </h2>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Shadow Mode
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {shadowData?.shadow_mode
                    ? 'ON — LSTM은 로그만 기록, final_score에 미반영'
                    : 'OFF — LSTM이 final_score에 반영됨'}
                </p>
                {shadowData?.score_formula && (
                  <p className="mt-1 font-mono text-xs text-slate-400">
                    {shadowData.score_formula}
                  </p>
                )}
              </div>

              <button
                onClick={handleShadowToggle}
                disabled={shadowToggling}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  shadowData?.shadow_mode
                    ? 'bg-amber-400 focus:ring-amber-400'
                    : 'bg-emerald-500 focus:ring-emerald-500'
                } ${shadowToggling ? 'opacity-50' : ''}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                    shadowData?.shadow_mode ? 'translate-x-1' : 'translate-x-6'
                  }`}
                />
              </button>
            </div>

            <div
              className={`mt-3 rounded-xl px-4 py-3 text-xs ${
                shadowData?.shadow_mode
                  ? 'border border-amber-200 bg-amber-50 text-amber-700'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {shadowData?.shadow_mode
                ? 'Shadow Mode가 켜져 있습니다. LSTM 점수는 로그에만 기록되며 봇 차단에 사용되지 않습니다.'
                : 'LSTM이 활성화되어 봇 탐지에 사용 중입니다.'}
            </div>
          </section>

          {/* ── 수치 설정 카드 ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">
                fx
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                점수 가중치 / 임계값 설정
              </h2>
              <span className="ml-auto text-xs text-slate-400">
                런타임 변경 (재시작 불필요)
              </span>
            </div>

            {/* 가중치 */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-600">
                가중치 (합계 = 1.0)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    LSTM
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={configDraft.lstm_weight}
                    onChange={(e) =>
                      setConfigDraft((d) => ({
                        ...d,
                        lstm_weight: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    KNN
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={configDraft.knn_weight}
                    onChange={(e) =>
                      setConfigDraft((d) => ({
                        ...d,
                        knn_weight: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Rule (자동)
                  </label>
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-500">
                    {config
                      ? (
                          1 -
                          parseFloat(configDraft.lstm_weight || '0') -
                          parseFloat(configDraft.knn_weight || '0')
                        ).toFixed(2)
                      : '-'}
                  </div>
                </div>
              </div>

              {/* 현재 공식 표시 */}
              <div
                className={`rounded-xl px-4 py-2 text-xs font-mono ${
                  !shadowData?.shadow_mode
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                {!shadowData?.shadow_mode
                  ? `final = rule x ${((1 - (config?.lstm_weight ?? 0.7) - (config?.knn_weight ?? 0.2)) * 100).toFixed(0)}% + KNN x ${((config?.knn_weight ?? 0.2) * 100).toFixed(0)}% + LSTM x ${((config?.lstm_weight ?? 0.7) * 100).toFixed(0)}%`
                  : 'Shadow 모드: final = rule x (1-knn_w) + KNN x knn_w'}
              </div>
            </div>

            {/* 임계값 */}
            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-600">
                판정 임계값
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Pass (이상이면 통과)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={configDraft.pass_threshold}
                    onChange={(e) =>
                      setConfigDraft((d) => ({
                        ...d,
                        pass_threshold: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Block (이하이면 차단)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={configDraft.challenge_threshold}
                    onChange={(e) =>
                      setConfigDraft((d) => ({
                        ...d,
                        challenge_threshold: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  pass: final &ge; {configDraft.pass_threshold || '0.7'}
                </span>
                <span className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  challenge: {configDraft.challenge_threshold || '0.3'} &lt;
                  final &lt; {configDraft.pass_threshold || '0.7'}
                </span>
                <span className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                  block: final &le; {configDraft.challenge_threshold || '0.3'}
                </span>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => void handleConfigSave()}
                disabled={configSaving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {configSaving ? '저장 중...' : '적용'}
              </button>
              <button
                onClick={() => void loadConfig()}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                초기화
              </button>
              {configMsg && (
                <span
                  className={`text-xs font-medium ${
                    configMsg.includes('실패')
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {configMsg}
                </span>
              )}
            </div>
          </section>

          {/* ── 챌린지 강제 발동 카드 ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 text-sm font-bold">
                !
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  챌린지 강제 발동
                </h2>
                <p className="text-xs text-slate-500">
                  다음 캡챠 요청을 강제로 이미지 챌린지로 전환 (발표 시연용)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const res = await forceChallenge();
                    alert(res.message);
                  } catch {
                    alert('강제 발동 실패');
                  }
                }}
                className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                모든 IP에 챌린지 강제 발동
              </button>
              <span className="text-xs text-slate-400">
                버튼 클릭 후 로그인 페이지에서 캡챠 체크박스를 누르면 이미지
                챌린지가 표시됩니다
              </span>
            </div>
          </section>

          {/* ── IP 제재 관리 카드 ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 text-sm font-bold">
                  IP
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    IP 제재 관리
                  </h2>
                  <p className="text-xs text-slate-500">
                    현재 잠금/밴 상태인 IP: {blockedTotal}건
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => void loadBlockedIps()}
                  disabled={blockedLoading}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  {blockedLoading ? '조회 중...' : '새로고침'}
                </button>
                {blockedTotal > 0 && (
                  <button
                    onClick={() => void handleUnblockAll()}
                    disabled={unblocking === 'all'}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 transition disabled:opacity-50"
                  >
                    {unblocking === 'all' ? '해제 중...' : '전체 해제'}
                  </button>
                )}
              </div>
            </div>

            {blockedIps.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-8 text-center">
                <p className="text-sm text-slate-400">
                  현재 제재된 IP가 없습니다.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                        IP 주소
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                        상태
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                        차단 횟수
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                        남은 시간
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedIps.map((entry) => (
                      <tr
                        key={entry.ip}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
                      >
                        <td className="px-4 py-3 font-mono text-sm text-slate-900">
                          {entry.ip}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {entry.ban && (
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                                BAN
                              </span>
                            )}
                            {entry.lock && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                LOCK
                              </span>
                            )}
                            {entry.wait && (
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                                WAIT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {entry.lock_count}회
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {entry.ban && entry.ttl.ban
                            ? formatTtl(entry.ttl.ban)
                            : entry.lock && entry.ttl.lock
                              ? formatTtl(entry.ttl.lock)
                              : entry.wait && entry.ttl.wait
                                ? formatTtl(entry.ttl.wait)
                                : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => void handleUnblock(entry.ip)}
                            disabled={unblocking === entry.ip}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition disabled:opacity-50"
                          >
                            {unblocking === entry.ip
                              ? '해제 중...'
                              : '제재 해제'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── 향후 확장 영역: 통계 ── */}
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-sm">
                📊
              </span>
              <h2 className="text-sm font-semibold text-slate-400">
                캡챠 통계 (예정)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              pass / challenge / block 비율, 시간대별 요청 수, 봇 탐지율
            </p>
          </section>

          {/* ── 향후 확장 영역: 세션 로그 ── */}
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-sm">
                📋
              </span>
              <h2 className="text-sm font-semibold text-slate-400">
                세션 로그 / 이미지 (예정)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              캡챠 세션 목록, MinIO 이미지 미리보기, 수동 라벨링
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
