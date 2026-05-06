import { CreditCard, Image, LockKeyhole, UserCheck } from 'lucide-react';
import ManualCallout from './ManualCallout';
import ManualSection from './ManualSection';

const checklist = [
  {
    title: '로그인 정보',
    description:
      '이메일과 비밀번호를 준비합니다. 체험 계정 버튼이 있는 경우 자동 입력을 사용할 수 있습니다.',
    icon: UserCheck,
  },
  {
    title: '이미지 인증',
    description:
      '로그인 과정에서는 동물 이미지를 순서대로 고르는 인증이 나올 수 있습니다.',
    icon: Image,
  },
  {
    title: '결제 수단',
    description: '파티 정산 시 카드 결제 또는 계좌 입금을 선택할 수 있습니다.',
    icon: CreditCard,
  },
  {
    title: '신뢰도',
    description:
      '일부 파티는 최소 신뢰도 조건이 있을 수 있으니 파티 상세에서 확인합니다.',
    icon: LockKeyhole,
  },
];

export default function BeforeStartSection() {
  return (
    <ManualSection
      id="before-start"
      number="00"
      title="시작 전 확인"
      description="Party-Up을 처음 이용하기 전에 아래 항목을 먼저 알아두면 이후 단계가 훨씬 쉽습니다."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {checklist.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <ManualCallout title="권장 이용 순서" variant="success">
          로그인 → 홈에서 파티 찾기 → 파티 조건 확인 → 참여 또는 채팅방 이동 →
          정산요청 → 결제 → 마이페이지에서 내역 확인 순서로 이용하면 됩니다.
        </ManualCallout>
      </div>
    </ManualSection>
  );
}
