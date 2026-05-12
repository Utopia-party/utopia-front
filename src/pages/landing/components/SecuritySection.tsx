import React, { useRef } from 'react';
import { FiShield, FiCheckCircle, FiAlertTriangle, FiZap, FiLock, FiCheck } from 'react-icons/fi';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

interface SecurityCardProps {
  step: string;
  title: string;
  description: string;
  bullets: string[];
  techDetail: string;
  icon: React.ReactNode;
  iconColorClass: string;
  iconBgClass: string;
}

const SECURITY_CARDS: SecurityCardProps[] = [
  {
    step: 'L0 — 사전 단계',
    title: '비간섭 행동 분석',
    description: '사용자가 인지하지 못하는 상태에서 수행되는 1차 분류 정상/챌린지/차단을 자동 분기합니다',
    bullets: [
      'HTTP 헤더 · 브라우저 환경 분석',
      'LSTM으로 마우스 궤적 시계열 봇 탐지',
      'pgvector KNN 유사도 1차 분류',
    ],
    techDetail: 'LSTM (PyTorch) + pgvector KNN',
    icon: <FiCheckCircle size={24} />,
    iconColorClass: 'text-green-500',
    iconBgClass: 'bg-green-100',
  },
  {
    step: 'L1 — 1단계',
    title: 'GAN 기반 이미지 캡챠',
    description: '회원가입 자동화 · 봇 차단 AI가 자동으로 풀 수 없는 시각적 챌린지를 동적 생성합니다',
    bullets: [
      'FastGAN으로 동물 이모지 실시간 생성',
      'PGD 적대적 노이즈로 CLIP 분류 차단',
      '요청마다 랜덤 3×3 그리드 구성',
    ],
    techDetail: 'FastGAN + PGD Adversarial + CLIP',
    icon: <FiShield size={24} />,
    iconColorClass: 'text-purple-500',
    iconBgClass: 'bg-purple-100',
  },
  {
    step: 'L2 — 2단계',
    title: '멀티모달 실시간 인증',
    description: '실제 사람이 실시간으로 수행하는 행동인지 검증 자동화 우회를 원천 차단합니다',
    bullets: [
      'MediaPipe HandLandmarker 손 포즈 검출',
      'PaddleOCR 손글씨 5자리 문자 인식',
      '포즈 + 문자 동시 검증으로 우회 불가',
    ],
    techDetail: 'MediaPipe + PaddleOCR',
    icon: <FiAlertTriangle size={24} />,
    iconColorClass: 'text-orange-500',
    iconBgClass: 'bg-orange-100',
  },
  {
    step: 'L3 — 3단계',
    title: '자동 제재 (BAN)',
    description: '신뢰도 점수(0~99) 기반 단계별 자동 제재 반복 위반자를 선제적으로 차단합니다',
    bullets: [
      '누적 위험 점수 초과 시 자동 발동',
      '노쇼 · 신고 누적 · 이상 행동 탐지',
      'IP · 기기 Fingerprint 영구 차단',
    ],
    techDetail: '신뢰도 점수 엔진 + 자동 제재 파이프라인',
    icon: <FiZap size={24} />,
    iconColorClass: 'text-red-500',
    iconBgClass: 'bg-red-100',
  },
];

export default function SecuritySection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  return (
    <section ref={sectionRef} id="security" className="py-20 md:py-32 bg-white">
      <div className="section-header flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-6">
          <FiLock /> 보안 시스템
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          직접 설계한 3단계 AI 보안 구조
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          각 단계마다 다른 AI 모델을 조합해 봇·어뷰저·비정상 사용자를
          레이어별로 차단하는 Dynamic Security Threshold 방어 체계입니다.
        </p>
      </div>

      <div className="stagger-grid grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16">
        {SECURITY_CARDS.map((card, index) => (
          <div
            key={index}
            className="hover-lift bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start will-change-transform"
          >
            <div className="flex items-start gap-4 mb-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconBgClass} ${card.iconColorClass}`}>
                {card.icon}
              </div>
              <div>
                <span className="text-xs font-black text-gray-400 mb-1 block">{card.step}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
              </div>
            </div>

            <ul className="space-y-2 w-full border-t border-gray-100 pt-4 mb-4">
              {card.bullets.map((bullet, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {bullet}
                </li>
              ))}
            </ul>

            {/* 기술 상세 뱃지 */}
            <div className="mt-auto pt-3 border-t border-gray-50 w-full">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-gray-500">
                <FiShield size={11} />
                {card.techDetail}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 전체 보안 플로우 */}
      <div className="bg-gradient-to-br from-purple-50/50 to-blue-50/50 rounded-3xl p-8 md:p-12 border border-purple-100/50">
        <h3 className="text-2xl font-bold text-gray-900 mb-10 text-center">전체 보안 플로우</h3>

        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          {[
            { step: '1', label: '사용자 행동 발생', sub: 'HTTP 헤더 · 마우스 데이터 수집' },
            { step: '2', label: 'L0 LSTM 분석', sub: '봇 확률 계산 · KNN 분류' },
            { step: '3', label: 'L1 GAN CAPTCHA', sub: '이미지 챌린지 생성 · 검증' },
            { step: '4', label: 'L2 멀티모달 인증', sub: '손 포즈 + OCR 동시 검증' },
            { step: '✓', label: '서비스 허용 또는 제재', sub: '신뢰도 점수 반영 · 자동 BAN', final: true },
          ].map((item, i, arr) => (
            <div key={item.step} className="flex flex-col md:flex-row items-center gap-3 flex-1">
              <div className="flex flex-col items-center text-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 shadow-sm ${
                  item.final
                    ? 'bg-purple-500 text-white border-2 border-purple-500'
                    : 'bg-white border-2 border-purple-100 text-purple-600'
                }`}>
                  {item.final ? <FiCheck size={16} strokeWidth={3} /> : item.step}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                </div>
              </div>
              {i < arr.length - 1 && (
                <div className="hidden md:block text-gray-300 font-bold text-lg shrink-0 mx-1">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
