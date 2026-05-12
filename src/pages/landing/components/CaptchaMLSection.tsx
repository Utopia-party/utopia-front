import { useRef } from 'react';
import { FiShield } from 'react-icons/fi';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

// FastGAN 학습 전후 비교
const ganComparison = [
  { label: '학습 데이터', before: '54장', after: '189장', highlight: false },
  { label: '에폭', before: '200', after: '500', highlight: false },
  { label: 'G_loss', before: '4.87 (불안정)', after: '0.42~1.0 (안정)', highlight: true },
  { label: 'D_loss 범위', before: '0.08~0.48 (D 압도)', after: '1.0~1.4 (균형)', highlight: true },
  { label: '결과', before: '모드 붕괴, D 과적합', after: '안정적 수렴', highlight: true },
];

// GAN 모델 비교
const ganModels = [
  {
    name: 'SDXL',
    tried: true,
    quality: '스타일 불일관',
    problem: '프롬프트 기반이라 매번 다른 스타일. 이모티콘 일관성 유지 불가. 모델 용량 ~7GB.',
    selected: false,
  },
  {
    name: 'StyleGAN2',
    tried: true,
    quality: 'FastGAN보다 낮음',
    problem: '소량 데이터(~200장)에서 품질 저하. 학습 데이터 최소 5,000장 이상 권장.',
    selected: false,
  },
  {
    name: 'FastGAN',
    tried: true,
    quality: '3개 중 최고',
    problem: '100장으로 고품질 256x256 생성. T4에서 2~3시간 학습. SLE + DiffAugment 적용.',
    selected: true,
  },
];

// BiLSTM 성능 비교
const bilstmPerf = [
  { method: 'Rule-Only (L3)', accuracy: '25.09%', f1: '10.83%', precision: '75.55%', recall: '5.74%', best: false },
  { method: 'BiLSTM (L5)', accuracy: '98.12%', f1: '98.85%', precision: '98.11%', recall: '99.62%', best: true },
];

// CLIP QualityGate 단계
const clipGates = [
  {
    step: '1단계',
    name: 'Discriminator Score',
    threshold: '> -1.5',
    desc: 'Hinge loss 기준 진짜 이미지 판별',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    step: '2단계',
    name: 'CLIP 코사인 유사도',
    threshold: '> 0.18',
    desc: '해당 동물로 인식 가능한지 의미적 유사도 측정',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
  },
];

// BiLSTM 피처
const bilstmFeatures = [
  { name: 'dx', calc: 'curr.x - prev.x', norm: '/ 1920', meaning: '수평 이동량' },
  { name: 'dy', calc: 'curr.y - prev.y', norm: '/ 1080', meaning: '수직 이동량' },
  { name: 'dt', calc: 'curr.t - prev.t', norm: '/ 1000', meaning: '시간 간격' },
  { name: 'speed', calc: 'sqrt(dx²+dy²) / dt', norm: '—', meaning: '순간 속도' },
  { name: 'angle', calc: 'atan2(dy, dx)', norm: '/ π', meaning: '이동 방향' },
];

export default function CaptchaMLSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  return (
    <section ref={sectionRef} id="captcha-ml" className="py-20 md:py-32 bg-white">
      {/* 헤더 */}
      <div className="section-header flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-50 text-purple-600 text-sm font-bold mb-6">
          <FiShield /> 캡챠 AI 모델 학습 결과
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          GAN · CLIP · BiLSTM
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
            캡챠 보안 파이프라인 학습 결과
          </span>
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          3개 모델을 직접 비교 실험하고 선택한 과정, 학습 설정, 성능 수치를 정리했습니다.
        </p>
      </div>

      {/* ── FastGAN ── */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-purple-500 inline-block" />
          FastGAN — 이미지 생성 모델 선택 과정
        </h3>

        {/* 모델 비교 */}
        <div className="stagger-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {ganModels.map((m) => (
            <div
              key={m.name}
              className={`hover-lift rounded-2xl border p-6 will-change-transform ${
                m.selected
                  ? 'border-purple-200 bg-purple-50'
                  : 'border-gray-100 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-gray-900 text-lg">{m.name}</p>
                {m.selected && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[11px] font-bold">
                    최종 선택
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-gray-500 mb-1">이미지 품질</p>
              <p className="text-sm font-semibold text-gray-800 mb-3">{m.quality}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{m.problem}</p>
            </div>
          ))}
        </div>

        {/* QualityGate 적용 전후 */}
        <h4 className="text-base font-bold text-gray-900 mb-3">QualityGate 적용 전후 비교</h4>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm mb-4">
          <table className="w-full min-w-[480px] text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['항목', '적용 전', '적용 후'].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {ganComparison.map((row) => (
                <tr key={row.label} className={row.highlight ? 'bg-purple-50/40' : ''}>
                  <td className="px-4 py-3 font-bold text-gray-700">{row.label}</td>
                  <td className="px-4 py-3 text-red-500 font-mono text-xs">{row.before}</td>
                  <td className="px-4 py-3 text-emerald-600 font-mono text-xs font-bold">{row.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 학습 설정 요약 카드 */}
        <div className="stagger-grid grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'lr_g / lr_d', value: '0.0002 / 0.0001', note: 'G:D = 2:1 (5회 실험 확정)' },
            { label: 'batch_size', value: '8', note: 'T4 16GB 기준 최적값' },
            { label: 'epochs', value: '500', note: '카테고리별 최적 에폭 자동 선택' },
            { label: 'DiffAugment', value: 'color·translation·cutout', note: '3종 증강 동시 적용' },
          ].map((item) => (
            <div key={item.label} className="hover-lift rounded-xl bg-gray-50 border border-gray-100 p-4 will-change-transform">
              <p className="text-[11px] font-bold text-purple-500 mb-1">{item.label}</p>
              <p className="font-black text-gray-900 text-sm mb-1">{item.value}</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CLIP ── */}
      <div className="mb-14">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-violet-500 inline-block" />
          CLIP — 생성 이미지 품질 검증 (QualityGate)
        </h3>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          SSIM/FID는 의미적 판단 불가, 별도 분류 모델은 추가 학습 필요.
          <strong className="text-gray-700"> openai/clip-vit-base-patch32 pretrained</strong>를 파인튜닝 없이 그대로 사용하여
          이미지-텍스트 유사도로 품질을 필터링합니다.
        </p>

        <div className="stagger-grid flex flex-col md:flex-row gap-3 mb-6">
          {clipGates.map((g, i) => (
            <div key={g.step} className="flex flex-col md:flex-row items-center gap-3 flex-1">
              <div className={`hover-lift w-full rounded-2xl border p-6 will-change-transform ${g.color} bg-white`}>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mb-3 ${g.color}`}>{g.step}</span>
                <p className="font-bold text-gray-900 mb-1">{g.name}</p>
                <p className="text-2xl font-extrabold text-gray-900 mb-2">{g.threshold}</p>
                <p className="text-sm text-gray-600">{g.desc}</p>
              </div>
              {i < clipGates.length - 1 && (
                <div className="shrink-0 text-gray-300 font-bold text-xl hidden md:block">→</div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
          <p className="text-xs font-bold text-violet-600 mb-2">Adversarial Perturbation (PGD 공격)</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            PGD 알고리즘으로 적대적 노이즈(ε=8/255)를 주입합니다. 사람 눈에는 보이지 않지만
            봇의 CLIP 모델이 오분류하도록 유도하여, <strong>사람은 쉽게 맞추고 봇은 틀리는</strong> 캡챠의 본질을 구현합니다.
            두 단계를 모두 통과한 이미지만 MinIO에 등록되며, 미통과 시 자동 재생성(최대 10회)합니다.
          </p>
        </div>
      </div>

      {/* ── BiLSTM ── */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-pink-500 inline-block" />
          BiLSTM — 마우스 패턴 봇 탐지
        </h3>

        {/* 모델 선택 근거 */}
        <div className="stagger-grid grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { name: '1D-CNN', reason: '장기 의존성 학습 불가', out: true },
            { name: 'Transformer', reason: '3,455건으로 과적합 위험', out: true },
            { name: 'GRU', reason: '양방향 문맥이 봇 탐지에 중요', out: true },
            { name: 'BiLSTM', reason: '양방향 시계열 + 소량 데이터 최적', out: false },
          ].map((m) => (
            <div
              key={m.name}
              className={`hover-lift rounded-xl border p-4 will-change-transform ${
                !m.out ? 'border-pink-200 bg-pink-50' : 'border-gray-100 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-black text-gray-900">{m.name}</p>
                {!m.out && (
                  <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[11px] font-bold">선택</span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{m.reason}</p>
            </div>
          ))}
        </div>

        {/* 성능 비교 */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm mb-6">
          <table className="w-full min-w-[480px] text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['방식', 'Accuracy', 'F1', 'Precision', 'Recall'].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {bilstmPerf.map((row) => (
                <tr key={row.method} className={row.best ? 'bg-pink-50/60' : ''}>
                  <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                    {row.method}
                    {row.best && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 text-[11px] font-bold">채택</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 font-bold tabular-nums ${row.best ? 'text-pink-600' : 'text-gray-500'}`}>{row.accuracy}</td>
                  <td className={`px-4 py-3 font-bold tabular-nums ${row.best ? 'text-pink-600' : 'text-gray-500'}`}>{row.f1}</td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">{row.precision}</td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">{row.recall}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 피처 엔지니어링 */}
        <h4 className="text-base font-bold text-gray-900 mb-3">피처 엔지니어링 (5차원)</h4>
        <div className="stagger-grid grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {bilstmFeatures.map((f) => (
            <div key={f.name} className="hover-lift rounded-xl bg-gray-50 border border-gray-100 p-4 will-change-transform">
              <p className="font-black text-pink-600 text-lg mb-1">{f.name}</p>
              <p className="text-[11px] font-mono text-gray-600 mb-1">{f.calc}</p>
              <p className="text-[11px] text-gray-400 mb-2">정규화: {f.norm}</p>
              <p className="text-xs font-bold text-gray-700">{f.meaning}</p>
            </div>
          ))}
        </div>

        {/* Confusion Matrix + Shadow Mode */}
        <div className="stagger-grid grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="hover-lift rounded-2xl border border-pink-100 bg-pink-50 p-6 will-change-transform">
            <p className="text-xs font-bold text-pink-600 mb-3">Confusion Matrix (증강 후 재학습)</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { label: 'TP', value: 518, color: 'bg-pink-100 text-pink-700' },
                { label: 'FP', value: 10, color: 'bg-gray-100 text-gray-600' },
                { label: 'FN', value: 2, color: 'bg-gray-100 text-gray-600' },
                { label: 'TN', value: 162, color: 'bg-pink-100 text-pink-700' },
              ].map((c) => (
                <div key={c.label} className={`rounded-xl p-3 ${c.color}`}>
                  <p className="text-2xl font-extrabold">{c.value}</p>
                  <p className="text-xs font-bold">{c.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">봇 520건 중 2건만 놓침</p>
          </div>
          <div className="hover-lift rounded-2xl border border-gray-100 bg-white shadow-sm p-6 will-change-transform">
            <p className="text-xs font-bold text-gray-500 mb-3">Shadow Mode 배포 전략</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold mt-0.5">ON</span>
                <p className="text-sm text-gray-600">LSTM 점수를 DB에 저장하지만 final_score에는 미반영. 기존 로직 유지하며 검증.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 text-[11px] font-bold mt-0.5">OFF</span>
                <p className="text-sm text-gray-600">rule 20% + KNN 20% + LSTM 60%로 최종 점수 계산.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[11px] font-bold mt-0.5">Fallback</span>
                <p className="text-sm text-gray-600">모델 로딩 실패 시 0.5(중립) 반환, 서비스 중단 없음.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
