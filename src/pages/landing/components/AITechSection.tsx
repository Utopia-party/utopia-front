import { useRef } from 'react';
import { FiCpu } from 'react-icons/fi';
import useLandingAnimations from '../../../hooks/useLandingAnimations';

const techLines = [
  {
    layer: 'L0',
    label: '비간섭 행동 분석',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
    techs: [
      {
        name: 'LSTM',
        desc: '마우스 궤적 시계열 데이터로 봇 확률 추론. best_model.pt CPU 추론 ~10-50ms.',
        tag: 'PyTorch',
        tagColor: 'bg-orange-50 text-orange-600',
      },
      {
        name: 'pgvector KNN',
        desc: '행동 벡터 임베딩을 PostgreSQL pgvector로 저장, KNN 유사도로 1차 봇 분류.',
        tag: 'PostgreSQL',
        tagColor: 'bg-blue-50 text-blue-600',
      },
      {
        name: 'HTTP 헤더 분석',
        desc: '브라우저 환경 정보·마우스 클릭 타이밍 수집 후 pass/challenge/block 분류.',
        tag: 'FastAPI',
        tagColor: 'bg-teal-50 text-teal-600',
      },
    ],
  },
  {
    layer: 'L1',
    label: 'GAN 기반 이미지 캡챠',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    dotColor: 'bg-purple-400',
    techs: [
      {
        name: 'FastGAN',
        desc: '동물 이모지를 실시간 생성. 요청마다 랜덤 세트 구성으로 자동화 우회 차단.',
        tag: 'GAN',
        tagColor: 'bg-purple-50 text-purple-600',
      },
      {
        name: 'PGD Adversarial',
        desc: 'PGD 알고리즘으로 적대적 노이즈 주입 → CLIP 등 멀티모달 AI의 이미지 분류 차단.',
        tag: 'Adversarial ML',
        tagColor: 'bg-pink-50 text-pink-600',
      },
      {
        name: 'CLIP 품질 필터',
        desc: 'GAN 생성 이모지를 CLIP으로 품질 검증 후 3×3 그리드 챌린지 구성.',
        tag: 'OpenAI CLIP',
        tagColor: 'bg-violet-50 text-violet-600',
      },
    ],
  },
  {
    layer: 'L2',
    label: '멀티모달 실시간 인증',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-400',
    techs: [
      {
        name: 'MediaPipe HandLandmarker',
        desc: '손 관절 21개 랜드마크 검출로 따봉·브이 등 손 포즈 실시간 검증.',
        tag: 'Google MediaPipe',
        tagColor: 'bg-green-50 text-green-600',
      },
      {
        name: 'PaddleOCR',
        desc: '종이에 적은 5자리 랜덤 문자를 OCR로 인식, 화면 표시값과 일치 여부 검증.',
        tag: 'OCR',
        tagColor: 'bg-blue-50 text-blue-600',
      },
    ],
  },
  {
    layer: 'Chat',
    label: '채팅 욕설·혐오 탐지',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotColor: 'bg-indigo-400',
    techs: [
      {
        name: 'KR-ELECTRA',
        desc: '22만건 학습, 파인튜닝 4회 실험 끝에 F1-Macro 0.7421 달성. 추론 24.4ms/msg.',
        tag: 'HuggingFace',
        tagColor: 'bg-yellow-50 text-yellow-600',
      },
      {
        name: 'Ollama LLM',
        desc: '경계 케이스(감탄·자기비하 등) 3단계 재판단. 로컬 추론으로 개인정보 보호.',
        tag: 'Local LLM',
        tagColor: 'bg-indigo-50 text-indigo-600',
      },
      {
        name: '블랙리스트 필터',
        desc: '키워드 직접 매칭 1단계. 화이트리스트 포함 시 즉시 통과.',
        tag: 'Rule-based',
        tagColor: 'bg-gray-50 text-gray-600',
      },
    ],
  },
  {
    layer: 'Match',
    label: '파티 빠른매칭',
    color: 'bg-green-50 text-green-700 border-green-200',
    dotColor: 'bg-green-400',
    techs: [
      {
        name: '임베딩 유사도 매칭',
        desc: '사용자·파티 임베딩 벡터 기반 유사도 계산 + 룰 기반 필터 조합으로 최적 파티 추천.',
        tag: 'pgvector',
        tagColor: 'bg-green-50 text-green-600',
      },
    ],
  },
];

export default function AITechSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  return (
    <section ref={sectionRef} id="ai-tech" className="py-20 md:py-32 bg-white">
      <div className="section-header flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gray-900 text-white text-sm font-bold mb-6">
          <FiCpu /> AI 기술 스택
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          프로젝트에 적용된
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
            AI 모델 & 알고리즘 전체 라인업
          </span>
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          보안 인증부터 채팅 탐지, 파티 매칭까지 각 레이어별로 직접 설계하고 구현한 AI 기술입니다.
        </p>
      </div>

      <div className="stagger-grid flex flex-col gap-8">
        {techLines.map((line) => (
          <div
            key={line.layer}
            className="hover-lift rounded-2xl border border-gray-100 bg-white shadow-sm p-6 md:p-8 will-change-transform"
          >
            {/* 레이어 헤더 */}
            <div className="flex items-center gap-3 mb-6">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black border ${line.color}`}>
                {line.layer}
              </span>
              <span className="text-lg font-bold text-gray-900">{line.label}</span>
              <div className={`ml-auto w-2 h-2 rounded-full ${line.dotColor}`} />
            </div>

            {/* 기술 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {line.techs.map((tech) => (
                <div
                  key={tech.name}
                  className="rounded-xl bg-gray-50 border border-gray-100 p-5"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-black text-gray-900 text-sm">{tech.name}</p>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold ${tech.tagColor}`}>
                      {tech.tag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{tech.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
