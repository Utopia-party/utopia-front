import { FiGithub, FiTwitter, FiLinkedin, FiMail } from 'react-icons/fi';
import Logo from '../ui/Logo'; // 기존에 만드신 Logo 컴포넌트
import Container from './Container';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    프로젝트: [
      { name: '핵심 기능', href: '#features' },
      { name: '보안 시스템', href: '#security' },
      { name: '기술 아키텍처', href: '#' },
      { name: '데모 체험', href: '#' },
    ],
    개발팀: [
      { name: '팀 소개', href: '#team' },
      { name: 'GitHub', href: 'https://github.com' },
      { name: '기술 문서', href: '#' },
      { name: '문의하기', href: '#' },
    ],
    리소스: [
      { name: '프로젝트 발표자료', href: '#' },
      { name: '시연 영상', href: '#' },
      { name: 'API 문서', href: '#' },
      { name: '설치 가이드', href: '#' },
    ],
  };

  return (
    <footer className="bg-[#0f111a] text-gray-400 py-12 md:py-20">
      <Container>
        {/* 상단 영역: 로고와 링크들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* 로고 및 설명 (2컬럼 차지) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-xl font-extrabold text-white tracking-tight">
                Party-Up
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              AI 기반 보안 및 신뢰성 중심의 구독 서비스 파티 매칭 플랫폼
              (경진대회 프로젝트)
            </p>
            {/* 소셜 아이콘 */}
            <div className="flex gap-4">
              {[FiGithub, FiTwitter, FiLinkedin, FiMail].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center hover:bg-gray-700 hover:text-white transition-all border border-gray-700/50"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* 링크 카테고리들 */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-bold mb-6">{category}</h4>
              <ul className="space-y-4 text-sm">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="hover:text-purple-400 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 하단 저작권 영역 */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
          <p>© {currentYear} Party-Up. 경진대회 제출용 프로젝트입니다.</p>
          <p className="flex items-center gap-1">
            Made with <span className="text-red-500 text-base">❤️</span> by
            Party-Up Team
          </p>
        </div>
      </Container>
    </footer>
  );
}
