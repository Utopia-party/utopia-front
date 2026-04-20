import { FiGithub, FiMail } from 'react-icons/fi';
import Avatar from '../../../components/ui/Avatar';
import image from '../../../assets/logo.png';
import { useRef } from 'react';
import useLandingAnimations from '../../../hooks/useLandingAnimations';
import { Link } from 'react-router';
import toast from 'react-hot-toast';

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
  skills: string[];
  github: string;
  linkedin?: string;
  email: string;
}

export default function TeamSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useLandingAnimations(sectionRef);

  const members: TeamMember[] = [
    {
      name: '김성보',
      role: 'Team Leader & AI Engineer',
      description: 'AI 보안 시스템 설계 및 GAN 기반 CAPTCHA 개발 담당',
      image,
      skills: ['Python', 'TensorFlow', 'PyTorch'],
      github: 'https://github.com/seongbokim',
      email: 'rkdtlgn0@naver.com',
    },
    {
      name: '박세영',
      role: 'Backend Developer',
      description: 'FastAPI 백엔드 아키텍처 설계 및 위험 점수 시스템 구현',
      image,
      skills: ['FastAPI', 'PostgreSQL', 'Redis'],
      github: 'https://github.com/zerose219',
      email: 'seyoung.park219@gmail.com',
    },
    {
      name: '도상원',
      role: 'Frontend Developer',
      description: 'React 기반 UI/UX 구현 및 실시간 채팅 시스템 개발',
      image,
      skills: ['React', 'TypeScript', 'Tailwind'],
      github: 'https://github.com/aksdkdn',
      email: 'do123195@gmail.com',
    },
    {
      name: '김영훈',
      role: 'ML Engineer',
      description: 'OCR, YOLO, MediaPipe 모델 학습 및 최적화 담당',
      image,
      skills: ['YOLO', 'OpenCV', 'MediaPipe'],
      github: 'https://github.com/zeroh00n',
      email: 'ahxh3103@gmail.com',
    },
    {
      name: '정재웅',
      role: 'Frontend & Backend',
      description: 'MediaPipe + OCR을 이용한 Captcha 서비스 구현',
      image,
      skills: ['React', 'FastAPI', 'MediaPipe', 'PaddleOCR'],
      github: 'https://github.com/dixk3458',
      email: 'dixk3458@naver.com',
    },
  ];

  const handleCopyEmail = async (email: string) => {
    if (!email) {
      toast.error('등록된 이메일이 없습니다.');
      return;
    }

    try {
      await navigator.clipboard.writeText(email);
      toast.success('이메일이 복사되었습니다.');
    } catch (error) {
      console.error(error);
      toast.error('이메일 복사에 실패했습니다.');
    }
  };

  return (
    <section ref={sectionRef} id="team" className="py-20 md:py-32 bg-white">
      <div className="section-header flex flex-col items-center text-center mb-16">
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

      <div className="stagger-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {members.map((member, index) => (
          <div
            key={index}
            className="hover-lift h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col items-center justify-between text-center p-8 will-change-transform"
          >
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

            <div className="flex items-center gap-4 pt-6 border-t border-gray-50 w-full justify-center">
              <Link to={member.github} target="_blank" className={ln}>
                <FiGithub size={18} />
              </Link>
              <button
                type="button"
                className={ln}
                onClick={() => handleCopyEmail(member.email)}
                title="이메일 복사"
              >
                <FiMail size={18} />
              </button>
            </div>
          </div>
        ))}

        <div className="hover-lift bg-linear-to-br from-primary to-secondary rounded-2xl p-8 flex flex-col items-center justify-center text-center text-white shadow-xl shadow-blue-200 will-change-transform">
          <div className="text-5xl mb-6">🏆</div>
          <h3 className="text-xl font-bold mb-2">
            카카오 AIaaS 3기 팀 프로젝트
          </h3>
          <p className="text-sm opacity-90 mb-6">
            이 프로젝트는 ImageNet 활용한 이미지 분류 AI CAPTCHA 서비스 구축을
            주제로 제작되었습니다.
          </p>
          <div className="space-y-2 text-sm font-medium">
            <p className="flex items-center justify-center gap-2">
              📅 개발 기간: 2026.03 - 2026.05
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

const ln = 'p-2 text-gray-400 hover:text-primary transition-colors';
