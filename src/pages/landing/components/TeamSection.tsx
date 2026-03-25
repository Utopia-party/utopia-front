import { FiGithub, FiLinkedin, FiMail } from 'react-icons/fi';
import Avatar from '../../../components/ui/Avatar';

import image from '../../../assets/logo.png';

// 팀원 데이터 타입 정의
interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  email?: string;
}

export default function TeamSection() {
  const members: TeamMember[] = [
    {
      name: '김성보',
      role: 'Team Leader & AI Engineer',
      description: 'AI 보안 시스템 설계 및 GAN 기반 CAPTCHA 개발 담당',
      image: image,
      skills: ['Python', 'TensorFlow', 'PyTorch'],
    },
    {
      name: '박세영',
      role: 'Backend Developer',
      description: 'FastAPI 백엔드 아키텍처 설계 및 위험 점수 시스템 구현',
      image: image,
      skills: ['FastAPI', 'PostgreSQL', 'Redis'],
    },
    {
      name: '도상원',
      role: 'Frontend Developer',
      description: 'React 기반 UI/UX 구현 및 실시간 채팅 시스템 개발',
      image: image,
      skills: ['React', 'TypeScript', 'Tailwind'],
    },
    {
      name: '김영훈',
      role: 'ML Engineer',
      description: 'OCR, YOLO, MediaPipe 모델 학습 및 최적화 담당',
      image: image,
      skills: ['YOLO', 'OpenCV', 'MediaPipe'],
    },
    {
      name: '정재웅',
      role: 'Security Specialist',
      description: '보안 아키텍처 설계 및 침투 테스트, 취약점 분석',
      image: image,
      skills: ['Security', 'Penetration Test', 'JWT'],
    },
  ];

  return (
    <section id="team" className="py-20 md:py-32 bg-white">
      {/* 헤더 영역 */}
      <div className="flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-purple-50 text-purple-600 text-sm font-bold mb-6">
          개발팀 소개
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          Party-Up 프로젝트 팀
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          AI, 보안, 풀스택 개발 전문성을 가진 5명의 개발자가 모여 안전한 구독
          파티 매칭 플랫폼을 구현했습니다.
        </p>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {members.map((member, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col items-center justify-between text-center p-8"
          >
            {/* 프로필 이미지 */}
            <Avatar src={member.image} alt={member.name} size="lg" />

            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {member.name}
            </h3>
            <p className="text-sm font-semibold text-purple-600 mb-4">
              {member.role}
            </p>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed px-4">
              {member.description}
            </p>

            {/* 기술 스택 뱃지 */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {member.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-purple-50 text-purple-500 text-[11px] font-bold rounded-full uppercase tracking-wider"
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* 소셜 링크 */}
            <div className="flex items-center gap-4 pt-6 border-t border-gray-50 w-full justify-center">
              <button className={buttonClassName}>
                <FiGithub size={18} />
              </button>
              <button className={buttonClassName}>
                <FiLinkedin size={18} />
              </button>
              <button className={buttonClassName}>
                <FiMail size={18} />
              </button>
            </div>
          </div>
        ))}

        {/* 마지막 프로젝트 정보 카드 (특별 디자인) */}
        <div className="bg-linear-to-br from-primary to-secondary rounded-2xl p-8 flex flex-col items-center justify-center text-center text-white shadow-xl shadow-blue-200">
          <div className="text-5xl mb-6">🏆</div>
          <h3 className="text-xl font-bold mb-2">경진대회 프로젝트</h3>
          <p className="text-sm opacity-90 mb-6">
            이 프로젝트는 경진대회 출품을 위해 제작되었습니다.
          </p>
          <div className="space-y-2 text-sm font-medium">
            <p className="flex items-center justify-center gap-2">
              📅 개발 기간: 2026.01 - 2026.03
            </p>
            <p className="flex items-center justify-center gap-2">
              👥 팀 구성: 5명
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const buttonClassName =
  'p-2 text-gray-400 hover:text-primary transition-colors';
