import {
  CreditCard,
  Flag,
  Heart,
  LineChart,
  UserRound,
  Users,
} from 'lucide-react';
import ManualSection from './ManualSection';

const mypageMenus = [
  {
    title: '프로필',
    description:
      '내 닉네임, 상태, 전화번호, 신뢰도, 참여 중인 파티 수, 최근 활동을 확인합니다.',
    icon: UserRound,
  },
  {
    title: '내 파티',
    description:
      '참여 중인 파티와 내가 만든 파티를 관리하고 채팅방으로 이동합니다.',
    icon: Users,
  },
  {
    title: '신뢰도 변화',
    description:
      '신뢰도 점수가 언제, 어떤 이유로 오르거나 내려갔는지 확인합니다.',
    icon: LineChart,
  },
  {
    title: '칭찬 내역',
    description: '받은 칭찬과 보낸 칭찬을 확인합니다.',
    icon: Heart,
  },
  {
    title: '결제 내역',
    description:
      '날짜, 파티명, 금액, 결제 상태, 결제 ID, 결제 수단을 확인합니다.',
    icon: CreditCard,
  },
  {
    title: '신고 내역',
    description: '내가 접수한 신고의 사유, 상태, 신고 ID를 확인합니다.',
    icon: Flag,
  },
];

export default function MypageManualSection() {
  return (
    <ManualSection
      id="mypage"
      number="09"
      title="마이페이지 이용 방법"
      description="마이페이지에서는 내 프로필, 파티, 신뢰도, 칭찬, 결제, 신고 내역을 확인할 수 있습니다."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mypageMenus.map((menu) => {
          const Icon = menu.icon;

          return (
            <div
              key={menu.title}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-black text-slate-950">{menu.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {menu.description}
              </p>
            </div>
          );
        })}
      </div>
    </ManualSection>
  );
}
