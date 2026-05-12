import { useRef } from 'react';
import { FiCheckCircle, FiTarget } from 'react-icons/fi';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

const measured = [
  {
    value: '0.7421',
    unit: 'F1-Macro',
    label: '욕설·혐오 탐지 정확도',
    sub: 'KR-ELECTRA 파인튜닝 4회 실험 실측',
    detail: '22만 건 학습 / Tesla T4 기준',
    color: 'border-indigo-200 bg-indigo-50/50',
    valueColor: 'text-indigo-600',
  },
  {
    value: '24.4ms',
    unit: '/ message',
    label: 'ML 추론 속도',
    sub: 'Tesla T4 GPU 기준 실측',
    detail: '실시간 채팅 적용 가능 수준',
    color: 'border-blue-200 bg-blue-50/50',
    valueColor: 'text-blue-600',
  },
  {
    value: '10~50ms',
    unit: '/ request',
    label: 'LSTM 봇탐지 추론',
    sub: 'CPU 추론 실측 (GPU 불필요)',
    detail: '마우스 궤적 시계열 분석',
    color: 'border-purple-200 bg-purple-50/50',
    valueColor: 'text-purple-600',
  },
  {
    value: '3단계',
    unit: '파이프라인',
    label: 'AI 보안 레이어',
    sub: 'L0 → L1 → L2 순차 통과 구조',
    detail: 'LSTM + GAN + MediaPipe/OCR',
    color: 'border-violet-200 bg-violet-50/50',
    valueColor: 'text-violet-600',
  },
];

const targets = [
  {
    value: '95%',
    label: '봇·악성 계정 사전 차단율',
    basis: 'L0~L2 순차 통과 기준 목표',
    measurement: 'captcha_sessions pass/block 비율로 실서비스 후 측정 예정',
  },
  {
    value: '70%',
    label: '고객센터 수동 처리 감소',
    basis: 'AI 자동 분쟁 조정 시스템 적용 기준',
    measurement: '신고 처리 건수 대비 자동/수동 비율로 측정 예정',
  },
  {
    value: '50%',
    label: '매칭 속도 단축',
    basis: '기존 SNS 방식 대비 목표',
    measurement: '빠른매칭 요청 → 참여 확정 평균 소요시간으로 측정 예정',
  },
];

export default function PerformanceSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  return (
    <section ref={sectionRef} id="performance" className="py-20 md:py-32 bg-gray-50/50">
      <div className="section-header flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-bold mb-6">
          성능 수치
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          실측 수치와 목표 수치
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          직접 실험하고 측정한 수치와 설계 목표 수치를 구분하여 투명하게 공개합니다.
        </p>
      </div>

      {/* 실측 */}
      <div className="mb-14">
        <div className="flex items-center gap-2 mb-6">
          <FiCheckCircle className="text-emerald-500" size={18} />
          <h3 className="text-lg font-bold text-gray-900">실측 수치</h3>
          <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">직접 실험·측정</span>
        </div>
        <div className="stagger-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {measured.map((m) => (
            <div key={m.label} className={`hover-lift rounded-2xl border p-6 will-change-transform ${m.color}`}>
              <div className="flex items-end gap-1 mb-1">
                <span className={`text-3xl font-extrabold tabular-nums ${m.valueColor}`}>{m.value}</span>
                <span className="text-sm text-gray-400 font-medium mb-1">{m.unit}</span>
              </div>
              <p className="font-bold text-gray-900 text-sm mb-1">{m.label}</p>
              <p className="text-xs text-gray-500 mb-1">{m.sub}</p>
              <p className="text-xs text-gray-400">{m.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 목표 */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <FiTarget className="text-blue-500" size={18} />
          <h3 className="text-lg font-bold text-gray-900">설계 목표 수치</h3>
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full">런칭 후 12개월 기준</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {targets.map((t) => (
            <div key={t.label} className="hover-lift rounded-2xl border border-blue-100 bg-white p-6 will-change-transform">
              <p className="text-4xl font-extrabold text-blue-600 tabular-nums mb-2">{t.value}</p>
              <p className="font-bold text-gray-900 text-sm mb-2">{t.label}</p>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{t.basis}</p>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 leading-relaxed">
                  <span className="font-bold text-gray-500">측정 방법: </span>
                  {t.measurement}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
