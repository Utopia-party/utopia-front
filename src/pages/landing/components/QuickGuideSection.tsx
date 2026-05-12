import { useRef } from 'react';
import { Link } from 'react-router';
import {
  FiLogIn,
  FiSearch,
  FiUsers,
  FiMessageSquare,
  FiCreditCard,
  FiArrowRight,
  FiBook,
} from 'react-icons/fi';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

const steps = [
  {
    number: '01',
    icon: FiLogIn,
    title: '로그인',
    desc: '소셜 로그인 또는 이메일로 가입 GAN 기반 이미지 캡챠 인증 진행',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    number: '02',
    icon: FiSearch,
    title: '파티 찾기',
    desc: 'Netflix, Spotify 등 원하는 서비스명으로 검색하거나 카테고리별 탐색',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    number: '03',
    icon: FiUsers,
    title: '파티 참여',
    desc: '방장 신뢰도, 1인 부담금, 정산 주기 확인 후 참여 신청',
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
  {
    number: '04',
    icon: FiMessageSquare,
    title: '채팅',
    desc: '파티원과 실시간 소통 욕설·비방 AI 자동 탐지 및 채팅 로그 보존',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    number: '05',
    icon: FiCreditCard,
    title: '정산',
    desc: '보호 결제로 선정산 후 파티 완성 시 자동 처리 분쟁 시 AI 자동 조정',
    color: 'text-pink-500',
    bg: 'bg-pink-50',
  },
];

export default function QuickGuideSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  return (
    <section ref={sectionRef} id="guide" className="py-20 md:py-32 bg-gray-50/50">
      <div className="section-header flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-bold mb-6">
          <FiBook /> 이용 가이드
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          Party-Up 5단계 이용 흐름
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          처음 이용하신다면 아래 순서대로 진행하세요.
          더 자세한 내용은 전체 매뉴얼에서 확인할 수 있습니다.
        </p>
      </div>

      {/* 스텝 카드 */}
      <div className="stagger-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="hover-lift relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-start will-change-transform"
            >
              <span className="absolute top-4 right-4 text-xs font-black text-gray-200">
                {step.number}
              </span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${step.bg} ${step.color}`}>
                <Icon size={18} />
              </div>
              <p className="font-bold text-gray-900 mb-2">{step.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          );
        })}
      </div>

      {/* 전체 매뉴얼 링크 */}
      <div className="flex justify-center">
        <Link
          to="/manual"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
        >
          전체 매뉴얼 보기
          <FiArrowRight />
        </Link>
      </div>
    </section>
  );
}
