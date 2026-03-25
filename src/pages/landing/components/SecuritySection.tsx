import React from 'react';
import {
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiZap,
  FiLock,
  FiCheck,
} from 'react-icons/fi';

import image from '../../../assets/logo.png';

// 타입 정의
interface SecurityCardProps {
  step: string;
  title: string;
  description: string;
  bullets: string[];
  icon: React.ReactNode;
  iconColorClass: string;
  iconBgClass: string;
}

export default function SecuritySection() {
  // 4개의 보안 카드 데이터
  const securityCards: SecurityCardProps[] = [
    {
      step: '사전 단계',
      title: '행동 기반 CAPTCHA',
      description:
        '비간섭적 인증으로 사람과 봇을 구분하고 스크립트 기반 자동화를 탐지합니다.',
      bullets: [
        'TLS Fingerprinting 검증',
        'HTTP Header 분석',
        '마우스 행동 패턴 분석',
      ],
      icon: <FiCheckCircle size={24} />,
      iconColorClass: 'text-green-500',
      iconBgClass: 'bg-green-100',
    },
    {
      step: '1단계',
      title: 'GAN 기반 3D CAPTCHA',
      description:
        '회원가입 자동화 및 봇을 차단하고 대량 계정 생성을 방지합니다.',
      bullets: [
        'AI 생성 이미지/3D 객체',
        '요청마다 동적 생성',
        '단순 OCR 우회 불가',
      ],
      icon: <FiShield size={24} />,
      iconColorClass: 'text-blue-500',
      iconBgClass: 'bg-blue-100',
    },
    {
      step: '2단계',
      title: '실시간 행동 인증',
      description: '실제 사람이 실시간으로 수행하는 행동인지 검증합니다.',
      bullets: [
        'OCR 모델로 손글씨 검증',
        'YOLO로 사물 검증',
        'MediaPipe로 손 형태 검증',
      ],
      icon: <FiAlertTriangle size={24} />,
      iconColorClass: 'text-orange-500',
      iconBgClass: 'bg-orange-100',
    },
    {
      step: '3단계',
      title: '자동 제재 (BAN)',
      description: '반복 위반자를 차단하고 서비스 신뢰성을 보호합니다.',
      bullets: [
        '누적 위험 점수 초과 시',
        '반복적 노쇼 발생 시',
        '신고 누적 및 AI 이상 행동 탐지 시',
      ],
      icon: <FiZap size={24} />,
      iconColorClass: 'text-red-500',
      iconBgClass: 'bg-red-100',
    },
  ];

  return (
    <section id="security" className="py-20 md:py-32 bg-white">
      {/* 1. 상단 헤더 영역 */}
      <div className="flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-6">
          <FiLock /> 보안 시스템
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          3단계 AI 보안 구조
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          봇, 어뷰저, 비정상 사용자를 차단하기 위한 AI 기반 3단계 제어 시스템을
          설계했습니다.
        </p>
      </div>

      {/* 2. 4개의 카드 그리드 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16">
        {securityCards.map((card, index) => (
          <div
            key={index}
            className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start"
          >
            <div className="flex items-start gap-4 mb-6">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconBgClass} ${card.iconColorClass}`}
              >
                {card.icon}
              </div>
              <div>
                <span className="text-xs font-bold text-gray-500 mb-1 block">
                  {card.step}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>

            <ul className="space-y-2.5 mt-auto w-full border-t border-gray-100 pt-5">
              {card.bullets.map((bullet, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2.5 text-sm text-gray-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 3. 하단 전체 보안 플로우 (타임라인 + 이미지) */}
      <div className="bg-linear-to-br from-purple-50/50 to-blue-50/50 rounded-3xl p-8 md:p-12 border border-purple-100/50 flex flex-col lg:flex-row gap-12 items-center">
        {/* 좌측 타임라인 */}
        <div className="w-full lg:w-1/2">
          <h3 className="text-2xl font-bold text-gray-900 mb-10">
            전체 보안 플로우
          </h3>

          <div className="relative pl-4 space-y-10">
            {/* 세로선 */}
            <div className="absolute left-7.75 top-4 bottom-4 w-px bg-purple-200"></div>

            {/* 타임라인 아이템 1 */}
            <div className="relative z-10 flex gap-6 items-start">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-purple-100 flex items-center justify-center text-sm font-bold text-purple-600 shrink-0 shadow-sm">
                1
              </div>
              <div className="pt-1 text-base font-semibold text-gray-800">
                사용자 행동 발생
              </div>
            </div>

            {/* 타임라인 아이템 2 */}
            <div className="relative z-10 flex gap-6 items-start">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-purple-100 flex items-center justify-center text-sm font-bold text-purple-600 shrink-0 shadow-sm">
                2
              </div>
              <div className="pt-1 text-base font-semibold text-gray-800">
                AI 위험 점수 계산
              </div>
            </div>

            {/* 타임라인 아이템 3 */}
            <div className="relative z-10 flex gap-6 items-start">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-purple-100 flex items-center justify-center text-sm font-bold text-purple-600 shrink-0 shadow-sm">
                3
              </div>
              <div className="pt-1">
                <div className="text-base font-semibold text-gray-800 mb-1">
                  위험도별 단계적 대응
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  정상 → 경고 → 의심 → 위험 → 고위험
                </div>
              </div>
            </div>

            {/* 타임라인 아이템 (마지막) */}
            <div className="relative z-10 flex gap-6 items-start">
              <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-purple-500 flex items-center justify-center text-white shrink-0 shadow-md">
                <FiCheck size={16} strokeWidth={3} />
              </div>
              <div className="pt-1 text-base font-semibold text-gray-800">
                자동 제재 또는 서비스 유지
              </div>
            </div>
          </div>
        </div>

        {/* 우측 이미지 */}
        <div className="w-full lg:w-1/2">
          <img
            src={image} // 실제 자물쇠 이미지 경로로 수정해주세요!
            alt="보안 자물쇠 이미지"
            className="w-full h-auto object-cover rounded-2xl shadow-xl border border-white"
          />
        </div>
      </div>
    </section>
  );
}
