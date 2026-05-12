import { FiArrowRight, FiShield, FiCpu, FiDatabase, FiGitBranch } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { useRef } from 'react';
import im from '../../../assets/logo.png';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

const stats = [
  { value: '3단계', label: 'AI 보안 파이프라인', icon: FiShield, color: 'text-purple-500' },
  { value: '7종', label: 'AI 모델 통합', icon: FiCpu, color: 'text-blue-500' },
  { value: '22만건', label: 'ML 학습 데이터', icon: FiDatabase, color: 'text-indigo-500' },
  { value: 'F1 0.74', label: '욕설 탐지 정확도', icon: FiGitBranch, color: 'text-violet-500' },
];

const techBadges = [
  'FastGAN', 'LSTM', 'pgvector', 'KR-ELECTRA',
  'MediaPipe', 'PaddleOCR', 'Ollama LLM',
];

export default function HeroSection() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef, { hero: true });

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative pt-10 pb-20 md:pt-16 md:pb-28 overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        {/* 좌측 텍스트 */}
        <div className="flex flex-col items-start">
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-600 text-sm font-bold mb-6 border border-purple-100">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            카카오 AIaaS 3기 · 팀 유토피아
          </div>

          <h1 className="hero-title text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-5">
            Party-Up
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
              AI 보안 구독 파티
            </span>
            <br />
            매칭 플랫폼
          </h1>

          <p className="hero-desc text-lg text-gray-600 leading-relaxed mb-5">
            OTT·음악·클라우드 구독 공유 시 발생하는{' '}
            <strong className="text-gray-900">사기·노쇼·봇 계정</strong>을 차단하기 위해
            직접 설계한 <strong className="text-gray-900">3단계 AI 보안 시스템</strong>과
            에스크로 정산 구조를 결합한 신뢰 중심 플랫폼입니다.
          </p>

          {/* AI 기술 뱃지 */}
          <div className="hero-info flex flex-wrap gap-2 mb-8">
            {techBadges.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="hero-actions flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="hero-demo-btn group inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white text-base font-semibold rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              데모 체험하기
              <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <a
              href="#security"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-gray-200 text-gray-700 text-base font-semibold rounded-xl shadow-sm hover:bg-gray-50 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
            >
              보안 구조 보기
            </a>
          </div>

          {/* 스탯 */}
          <div className="hero-stats mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 w-full pt-10 border-t border-gray-100">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`text-lg ${stat.color}`} />
                    <span className="text-xl font-extrabold text-gray-900">{stat.value}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 우측 이미지 */}
        <div className="hero-visual relative w-full flex items-center justify-center">
          <div className="hero-glow absolute -inset-6 bg-gradient-to-br from-purple-200 via-blue-200 to-indigo-200 opacity-40 blur-3xl rounded-3xl -z-10" />
          <img
            src={im}
            alt="Party-Up 로고"
            className="hero-image w-3/4 h-auto object-contain rounded-2xl"
          />
        </div>
      </div>
    </section>
  );
}
