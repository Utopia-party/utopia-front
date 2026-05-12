import Container from '../../components/layout/Container';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import SecuritySection from './components/SecuritySection';
import AITechSection from './components/AITechSection';
import MLResultSection from './components/MLResultSection';
import ArchSection from './components/ArchSection';
import DocumentShowcaseSection from './components/DocumentShowcaseSection';
import TeamSection from './components/TeamSection';

export default function Landing() {
  return (
    <div className="bg-white">
      <Navbar />

      {/* 1. Hero */}
      <Container className="py-4">
        <HeroSection />
      </Container>

      {/* 2. 핵심 기능 */}
      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <FeaturesSection />
        </Container>
      </div>

      {/* 3. 3단계 AI 보안 구조 */}
      <Container>
        <SecuritySection />
      </Container>

      {/* 4. AI 기술 라인업 */}
      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <AITechSection />
        </Container>
      </div>

      {/* 5. ML 학습 결과 */}
      <Container>
        <MLResultSection />
      </Container>

      {/* 6. 기술 아키텍처 */}
      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <ArchSection />
        </Container>
      </div>

      {/* 7. 작업 산출물 */}
      <Container className="py-4">
        <DocumentShowcaseSection />
      </Container>

      {/* 8. 팀 소개 */}
      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <TeamSection />
        </Container>
      </div>

      <Footer />
    </div>
  );
}
