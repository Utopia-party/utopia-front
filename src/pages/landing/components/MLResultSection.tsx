import { useRef } from 'react';
import { FiCpu, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

const experiments = [
  { round: '1차', model: 'klue/roberta-base', f1Macro: 0.7116, f1Weighted: 0.7132, precision: 0.7133, recall: 0.7142, batch: 128, lr: '2e-5', bestEpoch: 2 },
  { round: '2차', model: 'klue/roberta-large', f1Macro: 0.7351, f1Weighted: 0.7364, precision: 0.7482, recall: 0.7269, batch: 64, lr: '2e-5', bestEpoch: 2 },
  { round: '3차', model: 'klue/roberta-large', f1Macro: 0.7379, f1Weighted: 0.7389, precision: 0.7494, recall: 0.7301, batch: 64, lr: '1e-5', bestEpoch: 2 },
  { round: '4차', model: 'snunlp/KR-ELECTRA', f1Macro: 0.7421, f1Weighted: 0.7420, precision: 0.7466, recall: 0.7386, batch: 64, lr: '1e-5', bestEpoch: 2, isBest: true },
];

// Epoch별 F1-Macro 데이터 (보고서 기준)
const epochData = [
  { epoch: 1, r1: 0.7022, r2: 0.7168, r3: 0.7244, r4: 0.7344 },
  { epoch: 2, r1: 0.7116, r2: 0.7351, r3: 0.7379, r4: 0.7421 },
  { epoch: 3, r1: 0.7113, r2: 0.7247, r3: 0.7330, r4: 0.7383 },
  { epoch: 4, r1: 0.7056, r2: 0.7163, r3: 0.7253, r4: 0.7360 },
];

const seriesConfig = [
  { key: 'r1' as const, label: '1차 roberta-base', color: '#94a3b8', dotColor: '#94a3b8' },
  { key: 'r2' as const, label: '2차 roberta-large', color: '#60a5fa', dotColor: '#60a5fa' },
  { key: 'r3' as const, label: '3차 large+LR↓', color: '#a78bfa', dotColor: '#a78bfa' },
  { key: 'r4' as const, label: '4차 KR-ELECTRA', color: '#6366f1', dotColor: '#6366f1' },
];

// 라벨 분포 데이터
const labelDist = [
  {
    dataset: 'K-HATERS',
    total: 172158,
    bars: [
      { label: 'none', pct: 26.9, color: 'bg-emerald-400' },
      { label: 'offensive', pct: 52.1, color: 'bg-amber-400' },
      { label: 'hate', pct: 20.6, color: 'bg-rose-400' },
    ],
  },
  {
    dataset: 'kor_unsmile',
    total: 15005,
    bars: [
      { label: 'none', pct: 24.9, color: 'bg-emerald-400' },
      { label: 'offensive', pct: 20.9, color: 'bg-amber-400' },
      { label: 'hate', pct: 54.1, color: 'bg-rose-400' },
    ],
  },
  {
    dataset: 'nayohan',
    total: 7896,
    bars: [
      { label: 'none', pct: 45.0, color: 'bg-emerald-400' },
      { label: 'offensive', pct: 32.3, color: 'bg-amber-400' },
      { label: 'hate', pct: 22.7, color: 'bg-rose-400' },
    ],
  },
];

const datasets = [
  { name: 'humane-lab/K-HATERS', source: 'HuggingFace', count: '192,158건', feature: '뉴스 댓글 기반, 4단계 라벨' },
  { name: 'smilegate-ai/kor_unsmile', source: 'HuggingFace', count: '18,742건', feature: '소셜 미디어, 다중 혐오 카테고리' },
  { name: 'nayohan/korean-hate-speech', source: 'HuggingFace', count: '9,341건', feature: '온라인 커뮤니티, 3단계 라벨' },
];

const pipeline = [
  { step: '1단계', name: '블랙리스트 필터', desc: '키워드 직접 매칭. 화이트리스트 포함 시 즉시 통과.', color: 'bg-green-100 text-green-700', borderColor: 'border-green-200' },
  { step: '2단계', name: 'KR-ELECTRA (ML)', desc: 'none 확률 ≥ 0.95 → 통과 / score ≥ 0.97 → 즉시 차단. 평균 추론 24.4ms.', color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-200' },
  { step: '3단계', name: 'Ollama LLM', desc: '2단계 경계 케이스 재판단. 자기비하·감탄 표현 등 문맥 파악.', color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-200' },
];

const falseCases = [
  { input: '이거 존나 재밌다', predicted: 'offensive', actual: 'none', note: '강조·감탄 표현을 욕설로 오인' },
  { input: '내가 진짜 ㅄ이지 ㅋㅋ', predicted: 'offensive', actual: 'none', note: '자기 자신을 향한 비하 표현 미구분' },
  { input: '헐 미쳤다 진짜', predicted: 'offensive', actual: 'none', note: '감탄사 맥락 파악 부족' },
  { input: '야 이 개새끼야', predicted: 'offensive', actual: 'hate', note: '직접 공격적 표현 강도 과소 평가' },
];

// SVG 꺾은선 그래프
function EpochChart() {
  const W = 600, H = 220, PL = 52, PR = 16, PT = 16, PB = 32;
  const iW = W - PL - PR, iH = H - PT - PB;
  const minY = 0.69, maxY = 0.75;
  const xStep = iW / (epochData.length - 1);

  const toX = (i: number) => PL + i * xStep;
  const toY = (v: number) => PT + iH - ((v - minY) / (maxY - minY)) * iH;

  const yTicks = [0.70, 0.71, 0.72, 0.73, 0.74];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* 그리드 */}
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={PL} y1={toY(t)} x2={W - PR} y2={toY(t)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" />
          <text x={PL - 6} y={toY(t) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{t.toFixed(2)}</text>
        </g>
      ))}

      {/* X축 레이블 */}
      {epochData.map((d, i) => (
        <text key={d.epoch} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">Epoch {d.epoch}</text>
      ))}

      {/* Best Epoch 표시선 */}
      <line x1={toX(1)} y1={PT} x2={toX(1)} y2={H - PB} stroke="#6366f1" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.5" />
      <text x={toX(1) + 4} y={PT + 12} fontSize="9" fill="#6366f1" fontWeight="bold">Best Epoch</text>

      {/* 시리즈 */}
      {seriesConfig.map((s) => {
        const pts = epochData.map((d, i) => `${toX(i)},${toY(d[s.key])}`).join(' ');
        return (
          <g key={s.key}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth={s.key === 'r4' ? 2.5 : 1.5} strokeLinejoin="round" />
            {epochData.map((d, i) => (
              <circle key={i} cx={toX(i)} cy={toY(d[s.key])} r={s.key === 'r4' ? 4 : 3} fill={s.key === 'r4' ? s.color : 'white'} stroke={s.color} strokeWidth="1.5" />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export default function MLResultSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  return (
    <section ref={sectionRef} id="ml-result" className="py-20 md:py-32 bg-white">
      <div className="section-header flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold mb-6">
          <FiCpu /> AI 모델 학습 결과
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          한국어 욕설·혐오 탐지 모델
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">
            파인튜닝 실험 4회 결과
          </span>
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          약 22만 건의 한국어 데이터셋으로 4회 실험 끝에 F1-Macro{' '}
          <strong className="text-gray-700">0.7421</strong>을 달성한
          KR-ELECTRA 기반 채팅 보안 모듈을 채택했습니다.
        </p>
      </div>

      {/* 학습 데이터셋 */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-indigo-500 inline-block" />
          학습 데이터셋 (총 220,241건)
        </h3>
        <div className="stagger-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {datasets.map((d) => (
            <div key={d.name} className="hover-lift rounded-2xl border border-gray-100 bg-gray-50 p-6 will-change-transform">
              <p className="text-xs font-bold text-indigo-500 mb-1">{d.source}</p>
              <p className="font-bold text-gray-900 text-sm mb-2 break-all">{d.name}</p>
              <p className="text-2xl font-extrabold text-gray-900 mb-1">{d.count}</p>
              <p className="text-sm text-gray-500">{d.feature}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 라벨 분포 */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-indigo-500 inline-block" />
          데이터셋별 라벨 분포 (클래스 불균형)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {labelDist.map((d) => (
            <div key={d.dataset} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="font-black text-gray-900 mb-1">{d.dataset}</p>
              <p className="text-xs text-gray-400 mb-4">train set 기준</p>
              <div className="flex rounded-lg overflow-hidden h-4 mb-3">
                {d.bars.map((b) => (
                  <div key={b.label} className={`${b.color} h-full`} style={{ width: `${b.pct}%` }} title={`${b.label} ${b.pct}%`} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {d.bars.map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
                    <span className="text-xs text-gray-600 font-medium">{b.label} {b.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          K-HATERS의 offensive 비중(52.1%) 과다로 클래스 불균형 존재 → 향후 클래스 가중치(class_weight) 적용 검토 중
        </p>
      </div>

      {/* Epoch별 F1 꺾은선 그래프 */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-indigo-500 inline-block" />
          Epoch별 F1-Macro 추이
        </h3>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
          <EpochChart />
          {/* 범례 */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {seriesConfig.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 inline-block rounded-full" style={{ backgroundColor: s.color, height: s.key === 'r4' ? '3px' : '2px' }} />
                <span className="text-xs text-gray-600 font-medium">{s.label}</span>
                {s.key === 'r4' && <span className="text-[10px] bg-indigo-100 text-indigo-600 font-bold px-1.5 py-0.5 rounded-full">채택</span>}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">전 실험 Epoch 2에서 최고점 후 하락 → LR Overshooting 판단 → LR 2e-5 → 1e-5 조정</p>
        </div>
      </div>

      {/* 실험 결과 테이블 */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-indigo-500 inline-block" />
          실험별 성능 비교
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
          <table className="w-full min-w-[640px] text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['실험', '베이스 모델', 'Batch', 'LR', 'F1-Macro', 'F1-Weighted', 'Precision', 'Recall'].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {experiments.map((exp) => (
                <tr key={exp.round} className={(exp as any).isBest ? 'bg-indigo-50/60' : 'hover:bg-gray-50/50'}>
                  <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                    {exp.round}
                    {(exp as any).isBest && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[11px] font-bold">
                        <FiCheckCircle size={10} /> 채택
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">{exp.model}</td>
                  <td className="px-4 py-3 text-gray-600">{exp.batch}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{exp.lr}</td>
                  <td className={`px-4 py-3 font-bold tabular-nums ${(exp as any).isBest ? 'text-indigo-600' : 'text-gray-800'}`}>{exp.f1Macro.toFixed(4)}</td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">{exp.f1Weighted.toFixed(4)}</td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">{exp.precision.toFixed(4)}</td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">{exp.recall.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="stagger-grid grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="hover-lift rounded-2xl bg-indigo-50 border border-indigo-100 p-5 will-change-transform">
            <p className="text-xs font-bold text-indigo-500 mb-2">모델 전환 효과</p>
            <p className="text-sm text-gray-700 leading-relaxed">roberta-base → roberta-large 전환 시 F1-Macro <strong>+2.35%p</strong> 향상. KR-ELECTRA는 ELECTRA Discriminator 구조로 학습 속도 약 <strong>3배 빠름</strong>.</p>
          </div>
          <div className="hover-lift rounded-2xl bg-purple-50 border border-purple-100 p-5 will-change-transform">
            <p className="text-xs font-bold text-purple-500 mb-2">LR 조정 효과</p>
            <p className="text-sm text-gray-700 leading-relaxed">전 실험 Epoch 2에서 최고점 후 하락 → LR Overshooting 판단. 2e-5 → 1e-5 조정 후 <strong>안정적 학습</strong> 확인.</p>
          </div>
          <div className="hover-lift rounded-2xl bg-yellow-50 border border-yellow-100 p-5 will-change-transform">
            <p className="text-xs font-bold text-yellow-600 mb-2">데이터 품질 관리</p>
            <p className="text-sm text-gray-700 leading-relaxed">APEACH ↔ nayohan 간 <strong>85% 중복</strong> 발견 → APEACH 제거. K-MHaS는 datasets 라이브러리 지원 중단으로 제외.</p>
          </div>
        </div>
      </div>

      {/* 3단계 탐지 파이프라인 */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-indigo-500 inline-block" />
          3단계 탐지 파이프라인
        </h3>
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          {pipeline.map((p, i) => (
            <div key={p.step} className="flex flex-col md:flex-row items-center gap-3 flex-1">
              <div className={`hover-lift w-full rounded-2xl border p-6 ${p.borderColor} bg-white will-change-transform`}>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mb-3 ${p.color}`}>{p.step}</span>
                <p className="font-bold text-gray-900 mb-2">{p.name}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
              </div>
              {i < pipeline.length - 1 && <div className="shrink-0 text-gray-300 font-bold text-xl hidden md:block">→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 오탐 사례 분석 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <FiAlertCircle className="text-orange-500" />
          오탐 사례 분석 및 Ollama 보정
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm mb-4">
          <table className="w-full min-w-[540px] text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['입력 문장', '모델 예측', '실제 판정', '분석'].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {falseCases.map((fc) => (
                <tr key={fc.input} className="hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-mono text-xs text-gray-800">{fc.input}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">{fc.predicted}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${fc.actual === 'hate' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{fc.actual}</span></td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{fc.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
          경계 케이스는 stage2_pass_threshold(0.95) 미만으로{' '}
          <strong className="text-gray-700">3단계 Ollama LLM에 자동 위임</strong>됩니다.
          Ollama 프롬프트에 자기비하·감탄 표현 예시를 명시하여 오탐 보정.
          향후 오탐 케이스를 추가 학습 데이터로 활용하여 지속 개선 예정.
        </p>
      </div>
    </section>
  );
}
