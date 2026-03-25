import { FiArrowRight, FiZap, FiBox, FiUsers } from 'react-icons/fi';

import im from '../../../assets/logo.png';

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative pt-8 pb-16 md:pt-12 md:pb-24 overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="flex flex-col items-start">
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
              Party-Up <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-blue-500">
                AI 기반 구독 파티 매칭
              </span>
            </h1>

            {/* 설명 텍스트 */}
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              OTT, 음악, 클라우드 구독 서비스의 안전한 파티 매칭을 위해{' '}
              <strong className="text-gray-900">
                GAN 기반 3D CAPTCHA, OCR, YOLO, MediaPipe
              </strong>
              를 활용한 3단계 AI 보안 시스템을 설계했습니다.
            </p>

            {/* 정보 박스 */}
            <div className="w-full bg-blue-50/50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-8">
              <p className="text-sm text-blue-800 leading-relaxed">
                <span className="font-bold">🎯 프로젝트 목표:</span> 기존
                플랫폼의 "문제 발생 후 대응" 구조를 넘어, AI 기반 사전 탐지 +
                단계별 자동 제재로 봇과 악의적 사용자를 선제적으로 차단
              </p>
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex flex-wrap items-center gap-4">
            <button className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white text-base font-semibold rounded-lg shadow-md hover:opacity-90 transition-opacity">
              심사위원용 데모 체험 <FiArrowRight />
            </button>
            <button className="inline-flex items-center px-6 py-3.5 bg-white border border-gray-200 text-gray-700 text-base font-semibold rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
              기술 아키텍처
            </button>
          </div>

          {/* 하단 통계/요약 영역 */}
          <div className="mt-20 pt-10 mx-auto w-full">
            <div className="flex items-center justify-around w-full">
              {/* 요약 1 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FiZap className="text-yellow-500 text-xl" />
                  <span className="text-2xl font-bold text-gray-900">
                    3단계
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-500">
                  AI 보안 시스템
                </span>
              </div>

              {/* 요약 2 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FiBox className="text-green-500 text-xl" />
                  <span className="text-2xl font-bold text-gray-900">4개</span>
                </div>
                <span className="text-sm font-medium text-gray-500">
                  AI 모델 통합
                </span>
              </div>

              {/* 요약 3 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FiUsers className="text-blue-500 text-xl" />
                  <span className="text-2xl font-bold text-gray-900">
                    실시간
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-500">
                  위험도 분석
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full">
          {/* 뒤에 깔리는 은은한 빛 효과 (선택사항) */}
          <div className="absolute -inset-4  bg- bg-linear-to-b from-purple-200 to-blue-200 opacity-30 blur-2xl rounded-3xl -z-10"></div>
          <img
            src={im} // 실제 이미지 경로로 변경해주세요
            alt="팀원 이미지"
            className="w-full h-auto object-cover rounded-2xl shadow-xl border border-gray-100/50"
          />
        </div>
      </div>
    </section>
  );
}
