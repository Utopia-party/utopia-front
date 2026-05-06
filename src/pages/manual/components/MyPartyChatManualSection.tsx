import { Crown, MessageCircle, Users } from 'lucide-react';
import InstructionSteps from './InstructionSteps';
import ManualCallout from './ManualCallout';
import ManualSection from './ManualSection';

const myPartySteps = [
  {
    title: '마이페이지에서 내 파티로 이동합니다',
    description: '좌측 메뉴의 마이페이지를 펼치고 내 파티 메뉴를 선택합니다.',
    icon: Users,
  },
  {
    title: '참여 중인 파티를 확인합니다',
    description:
      '카드에서 서비스명, 인원, 월 1인 비용, 환급/정산 정보를 확인합니다.',
    icon: Users,
  },
  {
    title: '채팅방 버튼을 누릅니다',
    description: '파티원과 대화하거나 정산을 진행하려면 채팅방으로 이동합니다.',
    icon: MessageCircle,
  },
  {
    title: '리더라면 참여자 관리를 확인합니다',
    description:
      '내가 만든 파티라면 참여 신청 관리, 참여자 강퇴, 리더 위임 같은 관리 버튼이 표시될 수 있습니다.',
    icon: Crown,
  },
];

const roleRows = [
  ['일반 참여자', '파티 탈퇴, 채팅방 입장, 정산/결제 진행'],
  ['파티 리더', '참여 신청 관리, 참여자 강퇴, 리더 위임, 채팅방 관리'],
];

export default function MyPartyChatManualSection() {
  return (
    <ManualSection
      id="chat-payment"
      number="04"
      title="내 파티와 채팅방 이용 방법"
      description="참여한 파티는 마이페이지의 내 파티에서 확인하고, 채팅방에서 파티원들과 소통할 수 있습니다."
    >
      <InstructionSteps steps={myPartySteps} />

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
        <div className="bg-slate-50 px-5 py-4">
          <h3 className="font-black text-slate-950">역할별로 보이는 기능</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-y border-slate-200 bg-white text-slate-500">
              <tr>
                <th className="px-5 py-3 font-black">역할</th>
                <th className="px-5 py-3 font-black">사용 가능한 주요 기능</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {roleRows.map(([role, description]) => (
                <tr key={role}>
                  <td className="px-5 py-4 font-bold text-slate-950">{role}</td>
                  <td className="px-5 py-4 text-slate-600">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5">
        <ManualCallout title="채팅방에서 확인할 것" variant="info">
          우측 패널에서 파티 멤버, 리더 여부, 서비스명, 1인 부담금, 인원 상태를
          다시 확인할 수 있습니다.
        </ManualCallout>
      </div>
    </ManualSection>
  );
}
