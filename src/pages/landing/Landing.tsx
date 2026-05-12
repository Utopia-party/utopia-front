import Container from '../../components/layout/Container';
import FeaturesSection from './components/FeaturesSection';
import HeroSection from './components/HeroSection';
import SecuritySection from './components/SecuritySection';
import TeamSection from './components/TeamSection';
import Footer from '../../components/layout/Footer';
import Navbar from '../../components/layout/Navbar';
import DocumentShowcaseSection from './components/DocumentShowcaseSection';
import MLResultSection from './components/MLResultSection';
import QuickGuideSection from './components/QuickGuideSection';

export default function Landing() {
  return (
    <div className="bg-white">
      <Navbar />

      <Container className="py-4">
        <HeroSection />
      </Container>

      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <FeaturesSection />
        </Container>
      </div>

      <Container>
        <SecuritySection />
      </Container>

      <Container>
        <MLResultSection />
      </Container>

      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <QuickGuideSection />
        </Container>
      </div>

      <Container className="py-4">
        <DocumentShowcaseSection />
      </Container>

      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <TeamSection />
        </Container>
      </div>

      <Footer />
    </div>
  );
}
