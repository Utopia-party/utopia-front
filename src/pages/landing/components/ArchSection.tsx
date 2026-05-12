import { useRef } from 'react';
import { FiLayers } from 'react-icons/fi';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

const layers = [
  {
    label: 'Frontend',
    color: 'border-l-violet-400',
    bg: 'bg-violet-50',
    textColor: 'text-violet-700',
    items: ['React 19', 'TypeScript', 'Tailwind CSS', 'Zustand', 'TanStack Query', 'GSAP', 'WebSocket'],
  },
  {
    label: 'Backend',
    color: 'border-l-blue-400',
    bg: 'bg-blue-50',
    textColor: 'text-blue-700',
    items: ['FastAPI', 'PostgreSQL', 'Redis', 'MinIO', 'WebSocket', 'JWT', 'OAuth 2.0', 'Toss Payments'],
  },
  {
    label: 'AI — 보안',
    color: 'border-l-purple-400',
    bg: 'bg-purple-50',
    textColor: 'text-purple-700',
    items: ['FastGAN', 'PGD Adversarial', 'CLIP', 'LSTM', 'pgvector KNN', 'MediaPipe', 'PaddleOCR'],
  },
  {
    label: 'AI — 채팅',
    color: 'border-l-indigo-400',
    bg: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    items: ['KR-ELECTRA (HuggingFace)', 'Ollama LLM', 'Blacklist Filter', 'PyTorch FP16'],
  },
  {
    label: 'Infra',
    color: 'border-l-gray-400',
    bg: 'bg-gray-50',
    textColor: 'text-gray-700',
    items: ['AWS / GCP', 'Docker', 'GitHub Actions CI/CD', 'Nginx'],
  },
];

const flows = [
  {
    title: '회원가입 보안 플로우',
    color: 'border-purple-200 bg-purple-50/50',
    titleColor: 'text-purple-700',
    steps: ['HTTP 헤더 수집', '→', 'LSTM 봇탐지', '→', 'GAN CAPTCHA', '→', '가입 완료'],
  },
  {
    title: '파티 생성 인증 플로우',
    color: 'border-blue-200 bg-blue-50/50',
    titleColor: 'text-blue-700',
    steps: ['파티 생성 클릭', '→', 'MediaPipe 손 포즈', '→', 'PaddleOCR 문자 인식', '→', '파티 생성'],
  },
  {
    title: '채팅 탐지 플로우',
    color: 'border-indigo-200 bg-indigo-50/50',
    titleColor: 'text-indigo-700',
    steps: ['메시지 전송', '→', '블랙리스트 필터', '→', 'KR-ELECTRA 분류', '→', 'Ollama 재판단'],
  },
];

export default function ArchSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  return (
    <section ref={sectionRef} id="arch" className="py-20 md:py-32 bg-gray-50/50">
      <div className="section-header flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-bold mb-6">
          <FiLayers /> 기술 아키텍처
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          전체 기술 스택 구조
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          프론트엔드부터 AI 모델, 인프라까지 각 레이어별 사용 기술과 주요 데이터 흐름입니다.
        </p>
      </div>

      {/* 레이어 스택 */}
      <div className="stagger-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
        {layers.map((layer) => (
          <div
            key={layer.label}
            className={`hover-lift rounded-2xl border-l-4 bg-white border border-gray-100 shadow-sm p-6 will-change-transform ${layer.color}`}
          >
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black mb-4 ${layer.bg} ${layer.textColor}`}>
              {layer.label}
            </span>
            <div className="flex flex-wrap gap-2">
              {layer.items.map((item) => (
                <span
                  key={item}
                  className="px-2.5 py-1 bg-white border border-gray-100 text-gray-700 text-xs font-bold rounded-lg shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 주요 플로우 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">주요 데이터 흐름</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {flows.map((flow) => (
            <div
              key={flow.title}
              className={`rounded-2xl border p-6 ${flow.color}`}
            >
              <p className={`text-sm font-black mb-4 ${flow.titleColor}`}>{flow.title}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {flow.steps.map((step, i) => (
                  <span
                    key={i}
                    className={
                      step === '→'
                        ? 'text-gray-400 text-xs font-bold'
                        : 'px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-gray-700 border border-white/80 shadow-sm'
                    }
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
