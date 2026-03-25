import type { ReactNode } from 'react';
import {
  FiShield,
  FiCpu,
  FiTrendingUp,
  FiUsers,
  FiMessageSquare,
  FiDollarSign,
} from 'react-icons/fi';

interface FeatureCardProps {
  id: number;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
}

export default function FeaturesSection() {
  const features: FeatureCardProps[] = [
    {
      id: 1,
      title: 'AI 기반 보안',
      description:
        'GAN 기반 3D CAPTCHA, OCR, YOLO, MediaPipe를 활용한 3단계 인증 시스템으로 봇과 악의적 사용자를 차단합니다.',
      icon: <FiShield className="text-2xl text-white" />,
      color: 'bg-purple-500',
    },
    {
      id: 2,
      title: '자동 제재 시스템',
      description:
        'AI 위험 점수 기반으로 노쇼, 반복 위반자를 자동으로 감지하고 단계별 제재를 실행합니다.',
      icon: <FiCpu className="text-2xl text-white" />, // 로봇 아이콘 대용
      color: 'bg-blue-500',
    },
    {
      id: 3,
      title: '신뢰도 평가',
      description:
        '모든 사용자 활동을 점수화하여 신뢰도를 관리하고, 정상 활동 시 신뢰도가 상승합니다.',
      icon: <FiTrendingUp className="text-2xl text-white" />,
      color: 'bg-green-500',
    },
    {
      id: 4,
      title: '파티 매칭',
      description:
        'OTT, 음악, 클라우드 서비스 등 다양한 구독 서비스의 파티를 생성하고 신뢰할 수 있는 파티원과 매칭됩니다.',
      icon: <FiUsers className="text-2xl text-white" />,
      color: 'bg-orange-500',
    },
    {
      id: 5,
      title: '실시간 채팅',
      description:
        '파티원들과 실시간으로 소통하며 로그를 저장해 분쟁 발생 시 대응할 수 있습니다.',
      icon: <FiMessageSquare className="text-2xl text-white" />,
      color: 'bg-pink-500',
    },
    {
      id: 6,
      title: '안전한 정산',
      description:
        '선불/후불 결제 시스템과 거래 로그 저장으로 정산 분쟁을 예방하고 투명하게 관리합니다.',
      icon: <FiDollarSign className="text-2xl text-white" />,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <section id="features" className="py-8 md:py-12 lg:py-24 bg-gray-50/50">
      <div className="flex flex-col items-center text-center mb-16">
        {/* 상단 뱃지 */}
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-purple-50 text-purple-600 text-sm font-bold mb-6">
          핵심 기능
        </div>

        {/* 타이틀 */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          단순 매칭 플랫폼을 넘어선 <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-blue-500">
            AI 기반 위험 관리 시스템
          </span>
        </h2>

        {/* 서브 타이틀 */}
        <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          기존 플랫폼이 "문제 발생 후 대응" 구조였다면, Party-Up은 AI 기반 사전
          탐지 + 단계별 제재 구조를 설계했습니다.
        </p>
      </div>

      {/* 카드 그리드 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="bg-white p-8 rounded-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/50 hover:shadow-lg transition-shadow duration-300 flex flex-col items-start text-left"
          >
            {/* 아이콘 박스 */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm ${feature.color}`}
            >
              {feature.icon}
            </div>

            {/* 카드 텍스트 */}
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {feature.title}
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
