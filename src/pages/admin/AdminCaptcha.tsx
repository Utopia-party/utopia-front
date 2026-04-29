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
  fetchCaptchaStats,
  fetchCaptchaSessions,
  fetchCaptchaImages,
  fetchImageSets,
  deactivateCaptchaSet,
  deactivateImage,
  batchDeactivateImages,
  generateCaptchaImages,
  getGenerateStatus,
  type ShadowModeResponse,
  type BlockedIpEntry,
  type CaptchaConfigResponse,
  type CaptchaStatsResponse,
  type CaptchaSessionsResponse,
  type CaptchaSessionEntry,
  type CaptchaPeriod,
  type CaptchaImagesResponse,
  type CaptchaImageDetail,
  type CaptchaSetInfo,
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

  // ── 캡챠 통계 (대시보드) ──
  const [stats, setStats] = useState<CaptchaStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<CaptchaPeriod>('daily');
  const [statsStartDate, setStatsStartDate] = useState('');
  const [statsEndDate, setStatsEndDate] = useState('');

  const loadStats = useCallback(
    async (
      period: CaptchaPeriod = statsPeriod,
      startDate?: string,
      endDate?: string,
    ) => {
      setStatsLoading(true);
      try {
        const data = await fetchCaptchaStats(
          period,
          startDate || undefined,
          endDate || undefined,
        );
        setStats(data);
      } catch {
        // 조회 실패 시 무시
      } finally {
        setStatsLoading(false);
      }
    },
    [statsPeriod],
  );

  // ── 이미지 관리 ──
  const [imgTab, setImgTab] = useState<'emoji' | 'photo'>('emoji');
  const [imgCategory, setImgCategory] = useState<string>('');
  const [imgData, setImgData] = useState<CaptchaImagesResponse | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgPage, setImgPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<CaptchaImageDetail | null>(
    null,
  );
  const [imageSets, setImageSets] = useState<CaptchaSetInfo[]>([]);
  const [setsLoading, setSetsLoading] = useState(false);
  const [deactivatingSetId, setDeactivatingSetId] = useState<string | null>(
    null,
  );

  // 다중 선택
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [batchDeactivating, setBatchDeactivating] = useState(false);

  // 이모지 생성
  const [genCount, setGenCount] = useState(30);
  const [genSets, setGenSets] = useState(50);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState<string>('idle');

  const loadImages = useCallback(
    async (
      type: 'emoji' | 'photo' = imgTab,
      cat?: string,
      page: number = 1,
    ) => {
      setImgLoading(true);
      try {
        const data = await fetchCaptchaImages(type, cat || undefined, page, 50);
        setImgData(data);
      } catch {
        // ignore
      } finally {
        setImgLoading(false);
      }
    },
    [imgTab],
  );

  const handleImageClick = useCallback(
    async (image: CaptchaImageDetail) => {
      if (selectedImage?.id === image.id) {
        setSelectedImage(null);
        setImageSets([]);
        return;
      }
      setSelectedImage(image);
      setSetsLoading(true);
      try {
        const data = await fetchImageSets(image.id, imgTab);
        setImageSets(data.sets);
      } catch {
        setImageSets([]);
      } finally {
        setSetsLoading(false);
      }
    },
    [selectedImage, imgTab],
  );

  const handleDeactivateImage = useCallback(
    async (image: CaptchaImageDetail) => {
      if (
        !confirm(
          `이 ${imgTab === 'emoji' ? '이모지' : '실사'} 이미지를 비활성화하시겠습니까?\n연관 세트도 함께 정지됩니다.`,
        )
      )
        return;
      try {
        const result = await deactivateImage(image.id, imgTab);
        alert(result.message);
        // 목록 새로고침
        setSelectedImage(null);
        setImageSets([]);
        void loadImages(imgTab, imgCategory, imgPage);
      } catch {
        alert('이미지 비활성화에 실패했습니다.');
      }
    },
    [imgTab, imgCategory, imgPage, loadImages],
  );

  const handleDeactivateSet = useCallback(async (setId: string) => {
    if (!confirm('이 캡챠 세트를 정지하시겠습니까?')) return;
    setDeactivatingSetId(setId);
    try {
      await deactivateCaptchaSet(setId);
      setImageSets((prev) =>
        prev.map((s) => (s.id === setId ? { ...s, is_active: false } : s)),
      );
    } catch {
      alert('세트 정지에 실패했습니다.');
    } finally {
      setDeactivatingSetId(null);
    }
  }, []);

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCheckAll = useCallback(() => {
    if (!imgData?.images) return;
    const allIds = imgData.images.map((img) => img.id);
    setCheckedIds((prev) => {
      if (prev.size === allIds.length) return new Set();
      return new Set(allIds);
    });
  }, [imgData]);

  const handleBatchDeactivate = useCallback(async () => {
    const ids = Array.from(checkedIds);
    if (ids.length === 0) return;
    if (
      !confirm(
        `선택한 ${ids.length}장의 이미지를 비활성화하시겠습니까?\n관련 세트도 함께 정지됩니다.`,
      )
    )
      return;
    setBatchDeactivating(true);
    try {
      const result = await batchDeactivateImages(ids, imgTab);
      alert(result.message);
      setCheckedIds(new Set());
      setSelectedImage(null);
      setImageSets([]);
      void loadImages(imgTab, imgCategory, imgPage);
    } catch {
      alert('일괄 비활성화에 실패했습니다.');
    } finally {
      setBatchDeactivating(false);
    }
  }, [checkedIds, imgTab, imgCategory, imgPage, loadImages]);

  const handleGenerate = useCallback(async () => {
    if (
      !confirm(
        `카테고리당 ${genCount}장 생성 + ${genSets}개 세트를 만듭니다.\n진행하시겠습니까?`,
      )
    )
      return;
    setGenerating(true);
    setGenProgress('starting');
    try {
      const result = await generateCaptchaImages({
        num_per_category: genCount,
        num_sets: genSets,
      });
      if (result.status === 'already_running') {
        alert(result.message);
        setGenerating(false);
        return;
      }
      // 진행 상태 폴링
      const poll = setInterval(async () => {
        try {
          const status = await getGenerateStatus();
          setGenProgress(status.progress);
          if (
            status.progress === 'done' ||
            status.progress.startsWith('error')
          ) {
            clearInterval(poll);
            setGenerating(false);
            if (status.progress === 'done') {
              alert('이모지 생성 + 세트 생성 완료!');
              void loadImages(imgTab, imgCategory, 1);
            } else {
              alert(`생성 실패: ${status.progress}`);
            }
          }
        } catch {
          // ignore polling errors
        }
      }, 3000);
    } catch {
      alert('생성 요청에 실패했습니다.');
      setGenerating(false);
    }
  }, [genCount, genSets, imgTab, imgCategory, loadImages]);

  // ── 캡챠 세션 로그 ──
  const [sessionsData, setSessionsData] =
    useState<CaptchaSessionsResponse | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionFilter, setSessionFilter] = useState<string>('');

  const loadSessions = useCallback(
    async (page: number = 1, status?: string) => {
      setSessionsLoading(true);
      try {
        const data = await fetchCaptchaSessions(page, 20, status || undefined);
        setSessionsData(data);
      } catch {
        // 조회 실패 시 무시
      } finally {
        setSessionsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadShadowMode();
    loadBlockedIps();
    loadConfig();
    loadStats();
    loadSessions();
  }, [loadShadowMode, loadBlockedIps, loadConfig, loadStats, loadSessions]);

  // 이미지 관리 초기 로드 (1회)
  useEffect(() => {
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

          {/* ── 캡챠 통계 대시보드 ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            {/* 헤더 + 기간 선택 */}
            <div className="flex flex-col gap-4 mb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 text-sm font-bold">
                    📊
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">
                    캡챠 통계
                  </h2>
                  {stats && (
                    <span className="text-xs text-slate-400 ml-1">
                      {stats.start_date} ~ {stats.end_date}
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    void loadStats(statsPeriod, statsStartDate, statsEndDate)
                  }
                  disabled={statsLoading}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  {statsLoading ? '조회 중...' : '새로고침'}
                </button>
              </div>

              {/* 기간 탭 + 날짜 범위 */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* 일별 / 주별 / 월별 탭 */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                  {[
                    { key: 'daily' as CaptchaPeriod, label: '일별' },
                    { key: 'weekly' as CaptchaPeriod, label: '주별' },
                    { key: 'monthly' as CaptchaPeriod, label: '월별' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setStatsPeriod(tab.key);
                        setStatsStartDate('');
                        setStatsEndDate('');
                        void loadStats(tab.key, '', '');
                      }}
                      className={`px-3.5 py-1.5 text-xs font-medium transition ${
                        statsPeriod === tab.key
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 날짜 범위 */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={statsStartDate}
                    onChange={(e) => setStatsStartDate(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600"
                  />
                  <span className="text-xs text-slate-400">~</span>
                  <input
                    type="date"
                    value={statsEndDate}
                    onChange={(e) => setStatsEndDate(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600"
                  />
                  <button
                    onClick={() => {
                      if (statsStartDate && statsEndDate) {
                        void loadStats(
                          statsPeriod,
                          statsStartDate,
                          statsEndDate,
                        );
                      }
                    }}
                    disabled={!statsStartDate || !statsEndDate || statsLoading}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition disabled:opacity-40"
                  >
                    조회
                  </button>
                </div>

                {/* 빠른 선택 */}
                <div className="flex gap-1">
                  {[
                    { label: '오늘', days: 0 },
                    { label: '7일', days: 6 },
                    { label: '30일', days: 29 },
                    { label: '90일', days: 89 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setDate(end.getDate() - preset.days);
                        const fmt = (d: Date) => d.toISOString().slice(0, 10);
                        const s = fmt(start);
                        const e = fmt(end);
                        setStatsStartDate(s);
                        setStatsEndDate(e);
                        void loadStats(statsPeriod, s, e);
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-500 hover:bg-slate-50 transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 기간 요약 카드 */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">전체</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats?.summary.total.toLocaleString() ?? '-'}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-3">
                <p className="text-xs text-emerald-600">Pass</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {stats?.summary.pass_count.toLocaleString() ?? '-'}
                </p>
                <p className="text-xs text-emerald-500 mt-0.5">
                  {stats ? `${stats.summary.pass_rate}%` : '-'}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 px-4 py-3">
                <p className="text-xs text-amber-600">Challenge</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {stats?.summary.challenge_count.toLocaleString() ?? '-'}
                </p>
                <p className="text-xs text-amber-500 mt-0.5">
                  {stats ? `${stats.summary.challenge_rate}%` : '-'}
                </p>
              </div>
              <div className="rounded-xl bg-rose-50 px-4 py-3">
                <p className="text-xs text-rose-600">Block</p>
                <p className="text-2xl font-bold text-rose-700 mt-1">
                  {stats?.summary.block_count.toLocaleString() ?? '-'}
                </p>
                <p className="text-xs text-rose-500 mt-0.5">
                  {stats ? `${stats.summary.block_rate}%` : '-'}
                </p>
              </div>
            </div>

            {/* 챌린지 상세 카드 */}
            {stats?.challenge_detail && stats.challenge_detail.total > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                  <p className="text-xs text-violet-600">챌린지 통과율</p>
                  <p className="text-2xl font-bold text-violet-700 mt-1">
                    {stats.challenge_detail.pass_rate}%
                  </p>
                  <p className="text-xs text-violet-500 mt-0.5">
                    {stats.challenge_detail.pass_count}/
                    {stats.challenge_detail.total}건 통과
                  </p>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                  <p className="text-xs text-violet-600">평균 풀이 시간</p>
                  <p className="text-2xl font-bold text-violet-700 mt-1">
                    {stats.challenge_detail.avg_solve_time_ms > 0
                      ? `${(stats.challenge_detail.avg_solve_time_ms / 1000).toFixed(1)}초`
                      : '-'}
                  </p>
                  <p className="text-xs text-violet-500 mt-0.5">
                    챌린지 통과 기준
                  </p>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                  <p className="text-xs text-violet-600">미완료</p>
                  <p className="text-2xl font-bold text-violet-700 mt-1">
                    {stats.challenge_detail.pending_count}건
                  </p>
                  <p className="text-xs text-violet-500 mt-0.5">
                    이미지 풀이 중 이탈
                  </p>
                </div>
              </div>
            )}

            {/* 차트 2열: 점수 분포 + 추이 */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* 점수 분포 히스토그램 */}
              <div>
                <h3 className="text-xs font-semibold text-slate-600 mb-3">
                  점수 분포
                </h3>
                {(() => {
                  const BAR_MAX_H = 120; // 최대 바 높이 (px)
                  const buckets = stats?.score_distribution ?? [];
                  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
                  return (
                    <div
                      className="flex items-end gap-1.5"
                      style={{ height: `${BAR_MAX_H + 40}px` }}
                    >
                      {buckets.map((bucket, i) => {
                        const barH = Math.max(
                          (bucket.count / maxCount) * BAR_MAX_H,
                          2,
                        );
                        const barColor =
                          i < 3
                            ? 'bg-rose-400'
                            : i < 7
                              ? 'bg-amber-400'
                              : 'bg-emerald-400';
                        return (
                          <div
                            key={bucket.range}
                            className="flex-1 flex flex-col items-center justify-end"
                            style={{ height: '100%' }}
                          >
                            <span className="text-[10px] text-slate-500 font-medium mb-1">
                              {bucket.count || ''}
                            </span>
                            <div
                              className={`w-full rounded-t-sm ${barColor} transition-all duration-300`}
                              style={{ height: `${barH}px` }}
                            />
                            <span className="text-[10px] text-slate-400 mt-1">
                              {bucket.range.split('-')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-rose-400 font-medium">
                    Block
                  </span>
                  <span className="text-[10px] text-amber-400 font-medium">
                    Challenge
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Pass
                  </span>
                </div>
              </div>

              {/* 추이 (CSS 바 차트) */}
              <div>
                <h3 className="text-xs font-semibold text-slate-600 mb-3">
                  {statsPeriod === 'daily'
                    ? '일별'
                    : statsPeriod === 'weekly'
                      ? '주별'
                      : '월별'}{' '}
                  추이
                </h3>
                <div className="space-y-2">
                  {(stats?.trend ?? []).map((day) => {
                    const dayTotal = day.pass + day.challenge + day.block;
                    const maxTotal = Math.max(
                      ...(stats?.trend ?? []).map(
                        (d) => d.pass + d.challenge + d.block,
                      ),
                      1,
                    );
                    return (
                      <div key={day.date} className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-20 shrink-0 text-right font-mono">
                          {day.display}
                        </span>
                        <div className="flex-1 flex h-5 rounded overflow-hidden bg-slate-100">
                          {dayTotal > 0 && (
                            <>
                              <div
                                className="bg-emerald-400 transition-all"
                                style={{
                                  width: `${(day.pass / maxTotal) * 100}%`,
                                }}
                                title={`Pass: ${day.pass}`}
                              />
                              <div
                                className="bg-amber-400 transition-all"
                                style={{
                                  width: `${(day.challenge / maxTotal) * 100}%`,
                                }}
                                title={`Challenge: ${day.challenge}`}
                              />
                              <div
                                className="bg-rose-400 transition-all"
                                style={{
                                  width: `${(day.block / maxTotal) * 100}%`,
                                }}
                                title={`Block: ${day.block}`}
                              />
                            </>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 w-8 shrink-0">
                          {dayTotal}
                        </span>
                      </div>
                    );
                  })}
                  {(!stats?.trend || stats.trend.length === 0) && (
                    <p className="text-xs text-slate-400 text-center py-4">
                      데이터가 없습니다
                    </p>
                  )}
                </div>
                <div className="flex gap-4 mt-3">
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                    Pass
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                    Challenge
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                    Block
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── 이미지 관리 ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 text-sm font-bold">
                  🖼
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    이미지 관리
                  </h2>
                  <p className="text-xs text-slate-500">
                    이모지 · 실사 이미지 조회 및 세트 관리
                  </p>
                </div>
              </div>
            </div>

            {/* 이모지 자동 생성 */}
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h4 className="text-xs font-semibold text-emerald-800 mb-3">
                이모지 생성 + 세트 생성
              </h4>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">
                    카테고리당 생성 수
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={10}
                    value={genCount}
                    onChange={(e) => setGenCount(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="ml-2 text-xs font-medium text-emerald-700">
                    {genCount}장
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">
                    세트 수
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={genSets}
                    onChange={(e) => setGenSets(Number(e.target.value))}
                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs"
                  />
                </div>
                <button
                  onClick={() => void handleGenerate()}
                  disabled={generating}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {generating ? `생성 중 (${genProgress})...` : '생성 시작'}
                </button>
              </div>
            </div>

            {/* 탭: 이모지 / 실사 */}
            <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-lg w-fit">
              {(['emoji', 'photo'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setImgTab(tab);
                    setImgCategory('');
                    setImgPage(1);
                    setSelectedImage(null);
                    setImageSets([]);
                    setCheckedIds(new Set());
                    void loadImages(tab, '', 1);
                  }}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${
                    imgTab === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'emoji' ? '이모지' : '실사 사진'}
                </button>
              ))}
            </div>

            {/* 카테고리 필터 */}
            {imgData && imgData.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                <button
                  onClick={() => {
                    setImgCategory('');
                    setImgPage(1);
                    setSelectedImage(null);
                    setImageSets([]);
                    setCheckedIds(new Set());
                    void loadImages(imgTab, '', 1);
                  }}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    !imgCategory
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  전체 ({imgData.total})
                </button>
                {imgData.categories.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => {
                      setImgCategory(cat.category);
                      setImgPage(1);
                      setSelectedImage(null);
                      setImageSets([]);
                      setCheckedIds(new Set());
                      void loadImages(imgTab, cat.category, 1);
                    }}
                    className={`px-3 py-1 text-xs rounded-full transition ${
                      imgCategory === cat.category
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.category} ({cat.count})
                  </button>
                ))}
              </div>
            )}

            {/* 이미지 그리드 */}
            {imgLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                <span className="ml-2 text-sm text-slate-500">로딩 중...</span>
              </div>
            ) : !imgData || imgData.images.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-8 text-center">
                <p className="text-sm text-slate-400">이미지가 없습니다.</p>
              </div>
            ) : (
              <>
                {/* 선택 액션 바 */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={toggleCheckAll}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {checkedIds.size === imgData.images.length
                      ? '전체 해제'
                      : '전체 선택'}
                  </button>
                  {checkedIds.size > 0 && (
                    <button
                      onClick={() => void handleBatchDeactivate()}
                      disabled={batchDeactivating}
                      className="rounded-md bg-rose-500 px-3 py-1 text-xs font-medium text-white hover:bg-rose-600 transition disabled:opacity-50"
                    >
                      {batchDeactivating
                        ? '처리 중...'
                        : `선택 비활성화 (${checkedIds.size}장)`}
                    </button>
                  )}
                  <span className="text-xs text-slate-400">
                    클릭: 세트 조회 · 체크박스: 다중 선택
                  </span>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-4">
                  {imgData.images.map((img) => (
                    <div
                      key={img.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition hover:scale-105 ${
                        selectedImage?.id === img.id
                          ? 'border-violet-500 ring-2 ring-violet-200'
                          : checkedIds.has(img.id)
                            ? 'border-rose-400 ring-2 ring-rose-200'
                            : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checkedIds.has(img.id)}
                        onChange={() => toggleCheck(img.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-1 left-1 z-10 w-4 h-4 accent-rose-500 cursor-pointer"
                      />
                      <img
                        src={img.url}
                        alt={img.category}
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                        onClick={() => void handleImageClick(img)}
                      />
                    </div>
                  ))}
                </div>

                {/* 이미지 페이지네이션 */}
                {imgData.total_pages > 1 && (
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-slate-400">
                      {imgData.total}개 중{' '}
                      {(imgData.page - 1) * imgData.size + 1}~
                      {Math.min(imgData.page * imgData.size, imgData.total)}개
                    </p>
                    <div className="flex gap-1">
                      <button
                        disabled={imgPage <= 1}
                        onClick={() => {
                          const p = imgPage - 1;
                          setImgPage(p);
                          void loadImages(imgTab, imgCategory, p);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        이전
                      </button>
                      <span className="px-3 py-1 text-xs text-slate-500">
                        {imgData.page} / {imgData.total_pages}
                      </span>
                      <button
                        disabled={imgPage >= imgData.total_pages}
                        onClick={() => {
                          const p = imgPage + 1;
                          setImgPage(p);
                          void loadImages(imgTab, imgCategory, p);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 선택된 이미지 → 세트 목록 */}
            {selectedImage && (
              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-16 h-16 rounded-lg border-2 border-violet-400 overflow-hidden">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.category}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedImage.category}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedImage.id.slice(0, 8)}... ·{' '}
                      {imgTab === 'emoji' ? '이모지' : '실사'}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleDeactivateImage(selectedImage)}
                    className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600 transition"
                  >
                    이미지 비활성화
                  </button>
                </div>

                <h4 className="text-xs font-semibold text-slate-700 mb-2">
                  사용 중인 캡챠 세트
                </h4>

                {setsLoading ? (
                  <div className="flex items-center py-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                    <span className="ml-2 text-xs text-slate-500">
                      세트 조회 중...
                    </span>
                  </div>
                ) : imageSets.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">
                    이 이미지를 사용하는 세트가 없습니다.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-violet-200">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-violet-100">
                          <th className="px-3 py-2 text-left text-slate-600">
                            세트 ID
                          </th>
                          <th className="px-3 py-2 text-center text-slate-600">
                            이모지
                          </th>
                          <th className="px-3 py-2 text-center text-slate-600">
                            실사
                          </th>
                          <th className="px-3 py-2 text-center text-slate-600">
                            사용횟수
                          </th>
                          <th className="px-3 py-2 text-center text-slate-600">
                            상태
                          </th>
                          <th className="px-3 py-2 text-center text-slate-600">
                            관리
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {imageSets.map((s) => (
                          <tr key={s.id} className="border-t border-violet-100">
                            <td className="px-3 py-2 font-mono text-slate-700">
                              {s.id.slice(0, 8)}...
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600">
                              {s.emoji_count}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600">
                              {s.photo_count}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600">
                              {s.use_count}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  s.is_active
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {s.is_active ? '활성' : '정지'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {s.is_active && (
                                <button
                                  onClick={() => void handleDeactivateSet(s.id)}
                                  disabled={deactivatingSetId === s.id}
                                  className="rounded-md bg-rose-100 px-2.5 py-1 text-[10px] font-medium text-rose-700 hover:bg-rose-200 transition disabled:opacity-50"
                                >
                                  {deactivatingSetId === s.id
                                    ? '처리중...'
                                    : '정지'}
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
            )}
          </section>

          {/* ── 캡챠 세션 로그 ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 text-sm font-bold">
                  📋
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    세션 로그
                  </h2>
                  <p className="text-xs text-slate-500">
                    전체 {sessionsData?.total.toLocaleString() ?? 0}건
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 상태 필터 */}
                <select
                  value={sessionFilter}
                  onChange={(e) => {
                    setSessionFilter(e.target.value);
                    setSessionPage(1);
                    void loadSessions(1, e.target.value);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"
                >
                  <option value="">전체</option>
                  <option value="pass">Pass</option>
                  <option value="challenge">Challenge</option>
                  <option value="block">Block</option>
                </select>
                <button
                  onClick={() => void loadSessions(sessionPage, sessionFilter)}
                  disabled={sessionsLoading}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  {sessionsLoading ? '조회 중...' : '새로고침'}
                </button>
              </div>
            </div>

            {/* 세션 테이블 */}
            {!sessionsData || sessionsData.sessions.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-8 text-center">
                <p className="text-sm text-slate-400">
                  세션 데이터가 없습니다.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">
                          Session ID
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">
                          시간
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">
                          IP
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500">
                          Final
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500">
                          Rule
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500">
                          KNN
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500">
                          LSTM
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500">
                          결과
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionsData.sessions.map(
                        (session: CaptchaSessionEntry) => (
                          <tr
                            key={session.id}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
                          >
                            <td className="px-3 py-2.5 font-mono text-xs text-slate-700">
                              {session.id.slice(0, 8)}...
                            </td>
                            <td className="px-3 py-2.5 text-xs text-slate-500">
                              {session.created_at
                                ? new Date(
                                    session.created_at,
                                  ).toLocaleTimeString('ko-KR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })
                                : '-'}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-xs text-slate-600">
                              {session.client_ip}
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs font-semibold text-slate-900">
                              {session.final_score?.toFixed(4) ?? '-'}
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs text-slate-500">
                              {session.behavior_score?.toFixed(4) ?? '-'}
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs text-slate-500">
                              {session.vector_score?.toFixed(4) ?? '-'}
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs text-slate-500">
                              {session.lstm_score?.toFixed(4) ?? '-'}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  session.status === 'pass'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : session.status === 'challenge'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {session.status}
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                {sessionsData.total_pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-slate-400">
                      {sessionsData.total}건 중{' '}
                      {(sessionsData.page - 1) * sessionsData.size + 1}~
                      {Math.min(
                        sessionsData.page * sessionsData.size,
                        sessionsData.total,
                      )}
                      건
                    </p>
                    <div className="flex gap-1">
                      <button
                        disabled={sessionPage <= 1}
                        onClick={() => {
                          const p = sessionPage - 1;
                          setSessionPage(p);
                          void loadSessions(p, sessionFilter);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        이전
                      </button>
                      <span className="px-3 py-1 text-xs text-slate-500">
                        {sessionsData.page} / {sessionsData.total_pages}
                      </span>
                      <button
                        disabled={sessionPage >= sessionsData.total_pages}
                        onClick={() => {
                          const p = sessionPage + 1;
                          setSessionPage(p);
                          void loadSessions(p, sessionFilter);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
