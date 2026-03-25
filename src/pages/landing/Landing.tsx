import Container from '../../components/layout/Container';
import FeaturesSection from './components/FeaturesSection';
import HeroSection from './components/HeroSection';
import SecuritySection from './components/SecuritySection';
import TeamSection from './components/TeamSection';

export default function Landing() {
  return (
    <div>
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
      <div className="bg-gray-50/50 w-full">
        <Container className="py-4">
          <TeamSection />
        </Container>
      </div>
    </div>
  );
}
