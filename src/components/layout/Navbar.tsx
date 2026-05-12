import { Link } from 'react-router';
import Logo from '../ui/Logo';
import Container from './Container';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NavHashLink } from 'react-router-hash-link';
import { IoClose, IoMenu } from 'react-icons/io5';

type SectionId = 'features' | 'security' | 'ai-tech' | 'ml-result' | 'arch' | 'team';

interface NavItem {
  label: string;
  href: `#${SectionId}`;
  id: SectionId;
}

interface SectionState {
  isIntersecting: boolean;
  top: number;
  ratio: number;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('features');

  const navItems: NavItem[] = useMemo(
    () => [
      { label: '핵심 기능', href: '#features', id: 'features' },
      { label: '보안 시스템', href: '#security', id: 'security' },
      { label: 'AI 기술', href: '#ai-tech', id: 'ai-tech' },
      { label: 'ML 결과', href: '#ml-result', id: 'ml-result' },
      { label: '아키텍처', href: '#arch', id: 'arch' },
      { label: '팀 소개', href: '#team', id: 'team' },
    ],
    [],
  );

  const sectionStatesRef = useRef<Map<SectionId, SectionState>>(new Map());
  const toggleMenu = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) return;

    const navEl = document.querySelector('nav');
    const navHeight = navEl instanceof HTMLElement ? navEl.offsetHeight : 0;

    sections.forEach((section) => {
      sectionStatesRef.current.set(section.id as SectionId, {
        isIntersecting: false,
        top: Infinity,
        ratio: 0,
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id as SectionId;
          sectionStatesRef.current.set(id, {
            isIntersecting: entry.isIntersecting,
            top: entry.boundingClientRect.top,
            ratio: entry.intersectionRatio,
          });
        });

        const candidates = [...sectionStatesRef.current.entries()]
          .filter(([, state]) => state.isIntersecting)
          .sort((a, b) => {
            const aTop = Math.abs(a[1].top - navHeight);
            const bTop = Math.abs(b[1].top - navHeight);
            if (aTop !== bTop) return aTop - bTop;
            return b[1].ratio - a[1].ratio;
          });

        if (candidates.length > 0) {
          setActiveSection(candidates[0][0]);
        }
      },
      {
        root: null,
        rootMargin: `-${navHeight + 8}px 0px -55% 0px`,
        threshold: [0, 0.1, 0.25, 0.4, 0.6, 0.8],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [navItems]);

  const getDesktopLinkClass = (id: SectionId) =>
    [
      'relative text-sm font-medium transition-colors',
      activeSection === id ? 'text-primary' : 'text-gray-600 hover:text-gray-900',
    ].join(' ');

  const getMobileLinkClass = (id: SectionId) =>
    [
      'block px-3 py-2 text-base font-medium rounded-md transition-colors',
      activeSection === id
        ? 'text-primary bg-purple-50'
        : 'text-gray-700 hover:text-primary hover:bg-gray-50',
    ].join(' ');

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <Container className="flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <Logo />
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight group-hover:text-primary transition-colors">
            Party-UP
          </h1>
        </Link>

        <div className="hidden md:flex items-center gap-3 md:gap-5">
          {navItems.map((item) => (
            <NavHashLink
              key={item.id}
              to={item.href}
              smooth
              className={getDesktopLinkClass(item.id)}
            >
              {item.label}
              <span
                className={[
                  'absolute left-0 -bottom-1 h-0.5 w-full rounded-full bg-primary origin-left transition-transform duration-300',
                  activeSection === item.id ? 'scale-x-100' : 'scale-x-0',
                ].join(' ')}
              />
            </NavHashLink>
          ))}

          <Link
            to="/manual"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition-colors"
          >
            매뉴얼
          </Link>
        </div>

        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMenu}
            className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
          >
            {isOpen ? <IoClose /> : <IoMenu />}
          </button>
        </div>
      </Container>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {navItems.map((item) => (
            <NavHashLink
              key={item.id}
              to={item.href}
              smooth
              onClick={toggleMenu}
              className={getMobileLinkClass(item.id)}
            >
              {item.label}
            </NavHashLink>
          ))}
          <Link
            to="/manual"
            onClick={toggleMenu}
            className="block px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors"
          >
            매뉴얼
          </Link>
        </div>
      )}
    </nav>
  );
}
