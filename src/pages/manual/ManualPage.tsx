import ManualHeader from './components/ManualHeader';
import ManualNav from './components/ManualNav';
import BeforeStartSection from './components/BeforeStartSection';
import LoginManualSection from './components/LoginManualSection';
import FindPartyManualSection from './components/FindPartyManualSection';
import JoinPartyManualSection from './components/JoinPartyManualSection';
import MyPartyChatManualSection from './components/MyPartyChatManualSection';
import PaymentManualSection from './components/PaymentManualSection';
import CreatePartyManualSection from './components/CreatePartyManualSection';
import MypageManualSection from './components/MypageManualSection';
import ReportManualSection from './components/ReportManualSection';
import StatusDictionarySection from './components/StatusDictionarySection';
import TroubleshootingSection from './components/TroubleshootingSection';

export default function ManualPage() {
  return (
    <div className="flex w-full min-w-0 flex-1 flex-col bg-slate-50">
      <ManualHeader />
      <ManualNav />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <BeforeStartSection />
        <LoginManualSection />
        <FindPartyManualSection />
        <JoinPartyManualSection />
        <MyPartyChatManualSection />
        <PaymentManualSection />
        <CreatePartyManualSection />
        <MypageManualSection />
        <ReportManualSection />
        <StatusDictionarySection />
        <TroubleshootingSection />
      </main>
    </div>
  );
}
