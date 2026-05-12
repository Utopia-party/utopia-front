import Container from '../../components/layout/Container';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

import HeroSection from './components/HeroSection';
import ServiceBannerSection from './components/ServiceBannerSection';
import CompareSection from './components/CompareSection';
import FeaturesSection from './components/FeaturesSection';
import SecuritySection from './components/SecuritySection';
import AITechSection from './components/AITechSection';
import MLResultSection from './components/MLResultSection';
import CaptchaMLSection from './components/CaptchaMLSection';
import QuickMatchMLSection from './components/QuickMatchMLSection';
import HandOCRSection from './components/HandOCRSection';
import TrustScoreVisualSection from './components/TrustScoreVisualSection';
import BusinessModelSection from './components/BusinessModelSection';
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

      {/* 2. 서비스 로고 롤링 배너 */}
      <ServiceBannerSection />

      {/* 3. 왜 만들었나 — 비교 분석 */}
      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <CompareSection />
        </Container>
      </div>

      {/* 4. 핵심 기능 */}
      <Container>
        <FeaturesSection />
      </Container>

      {/* 5. 3단계 AI 보안 구조 */}
      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <SecuritySection />
        </Container>
      </div>

      {/* 6. AI 기술 라인업 */}
      <Container>
        <AITechSection />
      </Container>

      {/* 7. ML 학습 결과 — 욕설 탐지 */}
      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <MLResultSection />
        </Container>
      </div>

      {/* 7-1. 캡챠 AI 학습 결과 (FastGAN / CLIP / BiLSTM) */}
      <Container>
        <CaptchaMLSection />
      </Container>

      {/* 7-2. 빠른매칭 학습 파이프라인 */}
      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <QuickMatchMLSection />
        </Container>
      </div>

      {/* 7-3. HandOCR AI 학습 결과 */}
      <Container>
        <HandOCRSection />
      </Container>

      {/* 8. 신뢰도 시스템 */}
      <Container>
        <TrustScoreVisualSection />
      </Container>

      {/* 9. 비즈니스 모델 */}
      <Container>
        <BusinessModelSection />
      </Container>

      {/* 11. 기술 아키텍처 */}
      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <ArchSection />
        </Container>
      </div>

      {/* 12. 작업 산출물 */}
      <Container className="py-4">
        <DocumentShowcaseSection />
      </Container>

      {/* 13. 팀 소개 */}
      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <TeamSection />
        </Container>
      </div>

      <Footer />
    </div>
  );
}
