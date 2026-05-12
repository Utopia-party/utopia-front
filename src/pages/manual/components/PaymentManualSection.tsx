import { CreditCard, ReceiptText, Wallet } from 'lucide-react';
import InstructionSteps from './InstructionSteps';
import ManualCallout from './ManualCallout';
import ManualSection from './ManualSection';

const paymentSteps = [
  {
    title: '채팅방 하단의 정산요청을 누릅니다',
    description:
      '파티 채팅방 하단에 있는 정산요청 버튼을 눌러 결제 모달을 엽니다.',
    icon: ReceiptText,
  },
  {
    title: '결제 수단을 선택합니다',
    description: '카드 결제 또는 계좌 입금 중 하나를 선택합니다.',
    icon: CreditCard,
  },
  {
    title: '이번 달 결제 금액을 확인합니다',
    description: '모달 하단에 표시되는 이번 달 결제 금액을 확인합니다.',
    icon: Wallet,
  },
  {
    title: '결제 후 내역을 확인합니다',
    description:
      '마이페이지의 결제 내역에서 결제일, 금액, 상태, 결제 수단을 확인할 수 있습니다.',
    icon: ReceiptText,
  },
];

export default function PaymentManualSection() {
  return (
    <ManualSection
      id="payment"
      number="07"
      title="정산요청과 결제 방법"
      description="파티 채팅방에서 정산요청을 진행하고, 카드 결제 또는 계좌 입금으로 결제할 수 있습니다."
    >
      <InstructionSteps steps={paymentSteps} />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <CreditCard className="h-5 w-5" />
          </div>
          <h3 className="font-black text-slate-950">카드 결제</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            즉시 승인 방식입니다. 결제가 완료되면 결제 내역에서 상태를
            확인하세요.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <Wallet className="h-5 w-5" />
          </div>
          <h3 className="font-black text-slate-950">계좌 입금</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            관리자 승인 방식입니다. 입금 후 승인까지 시간이 걸릴 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <ManualCallout title="금액이 예상과 다를 때" variant="warning">
          파티 상세의 1인 부담금, 정산 주기, 환급/정산 안내를 먼저 확인하세요.
          그래도 다르면 파티 채팅방이나 신고센터를 통해 문의할 수 있습니다.
        </ManualCallout>
      </div>
    </ManualSection>
  );
}
