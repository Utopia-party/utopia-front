import { useEffect, useState } from 'react';
import AdminHeader from './components/AdminHeader';

const API = '/api/admin/moderation';

type Config = {
  stage1_enabled: boolean;
  stage2_enabled: boolean;
  stage3_enabled: boolean;
  stage2_pass_threshold: number;
  stage2_block_threshold: number;
  ollama_prompt_examples: { text: string; label: string }[];
  whitelist: string[];
  blacklist: string[];
};

type FinetuneStats = {
  total: number; hate: number; offensive: number; none: number;
  ready: boolean; min_required: number;
};

const TABS = ['파이프라인', '규칙 단어', '프롬프트', '파인튜닝'];

export default function AdminModerationConfig() {
  const [tab, setTab] = useState('파이프라인');
  const [config, setConfig] = useState<Config | null>(null);
  const [ftStats, setFtStats] = useState<FinetuneStats | null>(null);
  const [wlInput, setWlInput] = useState('');
  const [blInput, setBlInput] = useState('');
  const [exText, setExText] = useState('');
  const [exLabel, setExLabel] = useState('none');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/config`).then(r => r.json()).then(setConfig);
  }, []);

  useEffect(() => {
    if (tab === '파인튜닝') {
      fetch(`${API}/finetune/stats`).then(r => r.json()).then(setFtStats);
    }
  }, [tab]);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    await fetch(`${API}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
  };

  const addWord = async (type: 'whitelist' | 'blacklist') => {
    const word = type === 'whitelist' ? wlInput.trim() : blInput.trim();
    if (!word) return;
    const res = await fetch(`${API}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });
    const updated = await res.json();
    setConfig(c => c ? { ...c, [type]: updated } : c);
    type === 'whitelist' ? setWlInput('') : setBlInput('');
  };

  const removeWord = async (type: 'whitelist' | 'blacklist', word: string) => {
    const res = await fetch(`${API}/${type}/${encodeURIComponent(word)}`, { method: 'DELETE' });
    const updated = await res.json();
    setConfig(c => c ? { ...c, [type]: updated } : c);
  };

  if (!config) return <div className="p-8 text-sm text-gray-500">불러오는 중...</div>;

  return (
    <>
      <AdminHeader placeholder="설정 검색..." onSearch={() => {}}
        rightContent={
          <span className="rounded-md border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-sm font-semibold text-violet-700">
            모더레이션 설정
          </span>
        }
      />
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <section>
          <h1 className="text-2xl font-bold text-gray-900">채팅 모더레이션 설정</h1>
          <p className="mt-1 text-sm text-gray-500">탐지 파이프라인 온/오프 · 임계값 · 규칙 단어 · 프롬프트 관리</p>
        </section>

        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === t ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{t}</button>
          ))}
        </div>

        {/* 파이프라인 */}
        {tab === '파이프라인' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
              <p className="font-semibold text-gray-800">탐지 단계 온/오프</p>
              {([
                ['stage1_enabled', '1단계 — 규칙 기반', '화이트/블랙리스트 (0ms)'],
                ['stage2_enabled', '2단계 — smilegate ML', 'kor-hate-speech-detection (10~30ms)'],
                ['stage3_enabled', '3단계 — Ollama Exaone', '문맥 판단 (500ms~3s)'],
              ] as [keyof Config, string, string][]).map(([key, label, sub]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                  <input type="checkbox" checked={config[key] as boolean}
                    onChange={e => setConfig(c => c ? { ...c, [key]: e.target.checked } : c)}
                    className="w-4 h-4 accent-violet-600" />
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <p className="font-semibold text-gray-800">2단계 임계값</p>
              {([
                ['stage2_pass_threshold', '통과 임계값 (이하 → 정상)', 0.5, 0.9],
                ['stage2_block_threshold', '차단 임계값 (이상 → 즉시 차단)', 0.7, 0.99],
              ] as [keyof Config, string, number, number][]).map(([key, label, min, max]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold">{(config[key] as number).toFixed(2)}</span>
                  </div>
                  <input type="range" min={min} max={max} step={0.01}
                    value={config[key] as number}
                    onChange={e => setConfig(c => c ? { ...c, [key]: parseFloat(e.target.value) } : c)}
                    className="w-full accent-violet-600" />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => fetch(`${API}/config/reset`, { method: 'POST' }).then(r => r.json()).then(setConfig)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">초기화</button>
              <button onClick={save} disabled={saving}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        )}

        {/* 규칙 단어 */}
        {tab === '규칙 단어' && (
          <div className="space-y-4">
            {([
              ['whitelist', '화이트리스트', '항상 정상 처리', wlInput, setWlInput, 'bg-green-50 text-green-700 border-green-200'],
              ['blacklist', '블랙리스트', '항상 즉시 차단', blInput, setBlInput, 'bg-red-50 text-red-700 border-red-200'],
            ] as const).map(([type, title, sub, val, setVal, tagStyle]) => (
              <div key={type} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-gray-800 mb-1">{title}</p>
                <p className="text-xs text-gray-400 mb-3">{sub}</p>
                <div className="flex flex-wrap gap-2 mb-3 min-h-8">
                  {config[type].map(w => (
                    <span key={w} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${tagStyle}`}>
                      {w}
                      <button onClick={() => removeWord(type, w)} className="opacity-60 hover:opacity-100 text-sm leading-none">x</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={val} onChange={e => setVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addWord(type)}
                    placeholder="단어 입력 후 추가"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400" />
                  <button onClick={() => addWord(type)}
                    className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700">추가</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 프롬프트 */}
        {tab === '프롬프트' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-gray-800 mb-1">Ollama few-shot 예시</p>
              <p className="text-xs text-gray-400 mb-4">Exaone에게 넘겨주는 판단 예시</p>
              <div className="space-y-1 mb-4">
                {config.ollama_prompt_examples.map((ex, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <span className="font-mono text-sm flex-1">{ex.text}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                      ex.label === 'none' ? 'bg-green-50 text-green-700' :
                      ex.label === 'offensive' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                    }`}>{ex.label}</span>
                    <button onClick={() => setConfig(c => c ? {
                      ...c, ollama_prompt_examples: c.ollama_prompt_examples.filter((_, j) => j !== i)
                    } : c)} className="text-gray-400 hover:text-gray-700 text-sm">x</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={exText} onChange={e => setExText(e.target.value)}
                  placeholder="예시 텍스트"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400" />
                <select value={exLabel} onChange={e => setExLabel(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400">
                  <option value="none">none</option>
                  <option value="offensive">offensive</option>
                  <option value="hate">hate</option>
                </select>
                <button onClick={() => {
                  if (!exText.trim()) return;
                  setConfig(c => c ? { ...c, ollama_prompt_examples: [...c.ollama_prompt_examples, { text: exText.trim(), label: exLabel }] } : c);
                  setExText('');
                }} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700">추가</button>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={save} disabled={saving}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        )}

        {/* 파인튜닝 */}
        {tab === '파인튜닝' && ftStats && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-gray-800 mb-4">학습 데이터 현황</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[['hate', ftStats.hate, '차단'], ['offensive', ftStats.offensive, '경고'], ['none', ftStats.none, '오탐지']].map(([k, v, l]) => (
                  <div key={k} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{v}</p>
                    <p className="text-xs text-gray-400 mt-1">{k} ({l})</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>총 데이터</span><span>{ftStats.total} / {ftStats.min_required}건</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200">
                <div className="h-1.5 rounded-full bg-violet-500 transition-all"
                  style={{ width: `${Math.min(100, Math.round(ftStats.total / ftStats.min_required * 100))}%` }} />
              </div>
            </div>

            <div className={`px-4 py-3 rounded-xl text-sm border ${ftStats.ready ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {ftStats.ready ? '데이터가 충분합니다. 파인튜닝을 실행할 수 있습니다.' : '데이터 부족 — 라벨별 100건 이상 필요합니다.'}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-gray-800 mb-1">파인튜닝 실행</p>
              <p className="text-xs text-gray-400 mb-4">GPU 서버의 smilegate 모델 기반으로 파인튜닝</p>
              <button disabled={!ftStats.ready}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
                파인튜닝 시작
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
