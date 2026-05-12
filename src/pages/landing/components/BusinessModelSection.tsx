import { useRef } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

const revenues = [
  {
    title: '중개 수수료',
    model: '파티 성사 대금의 30%',
    desc: '플랫폼 신뢰도 확보 후 단계적 조정. 경쟁 플랫폼 대비 합리적 수준 유지.',
    color: 'border-purple-200 bg-purple-50/50',
    tag: '핵심 수익',
    tagColor: 'bg-purple-100 text-purple-700',
  },
  {
    title: 'B2B 보안 API',
    model: 'SaaS 월정액 / API 호출량 과금',
    desc: '3단계 AI 인증 모듈 라이선스. 예매·숙박·공유경제 플랫폼 대상.',
    color: 'border-blue-200 bg-blue-50/50',
    tag: '확장 수익',
    tagColor: 'bg-blue-100 text-blue-700',
  },
  {
    title: '추천인 프로그램',
    model: '신규 가입자 유치 수수료 환급',
    desc: '기존 유저 초대 시 수수료 일부 환급. 유저 수 증가 → 거래량 증가 선순환.',
    color: 'border-green-200 bg-green-50/50',
    tag: '그로스',
    tagColor: 'bg-green-100 text-green-700',
  },
  {
    title: '플랫폼 광고',
    model: '구글 애드센스 기반 타겟 광고',
    desc: '구독 서비스·엔터테인먼트 카테고리 타겟팅. 인증된 활성 유저 기반 CPM 우위.',
    color: 'border-orange-200 bg-orange-50/50',
    tag: '부가 수익',
    tagColor: 'bg-orange-100 text-orange-700',
  },
];

const costs = [
  { label: '인프라', detail: 'AWS/GCP AI 추론 GPU 서버. 탄력적 스케일링.', pct: 40 },
  { label: '결제망', detail: 'PG사 수수료 1.5~3% + 에스크로 별도.', pct: 25 },
  { label: '인건비', detail: '런칭 초기 최소 인력 → 점진 확대.', pct: 25 },
  { label: '마케팅', detail: '추천인 인센티브 포함 그로스 해킹 중심.', pct: 10 },
];

export default function BusinessModelSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  return (
    <section ref={sectionRef} id="business" className="py-20 md:py-32 bg-white">
      <div className="section-header flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-green-50 text-green-600 text-sm font-bold mb-6">
          비즈니스 모델
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          어떻게 수익을 만드나요
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          중개 수수료 중심의 안정적 수익 구조에 B2B API 라이선스로 확장성을 더했습니다.
        </p>
      </div>

      {/* 수익 구조 */}
      <div className="stagger-grid grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
        {revenues.map((r) => (
          <div key={r.title} className={`hover-lift rounded-2xl border p-6 will-change-transform ${r.color}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-black text-gray-900">{r.title}</p>
                  <p className="text-sm text-gray-500 font-medium">{r.model}</p>
                </div>
                <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${r.tagColor}`}>{r.tag}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{r.desc}</p>
            </div>
        ))}
      </div>

      {/* 수익 흐름 요약 */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 p-6 mb-14">
        <p className="text-sm font-bold text-gray-700 mb-4">수익 선순환 구조</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {['신뢰 기반 플랫폼', '유저 증가', '거래량 증가', '수수료 수익', 'B2B API 확장', '보안 범용 서비스화'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-white rounded-lg font-semibold text-gray-800 shadow-sm border border-white/80 text-xs">{step}</span>
              {i < arr.length - 1 && <FiArrowRight size={12} className="text-gray-400 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* 비용 구조 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6">주요 비용 구조</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {costs.map((c) => (
            <div key={c.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-gray-900">{c.label}</p>
                <span className="text-sm font-black text-gray-500">{c.pct}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: `${c.pct}%` }} />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{c.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
