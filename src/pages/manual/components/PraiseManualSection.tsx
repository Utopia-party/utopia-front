import { Heart, Clock } from 'lucide-react';
import InstructionSteps from './InstructionSteps';
import ManualCallout from './ManualCallout';
import ManualSection from './ManualSection';

const praiseSteps = [
  {
    title: '파티 채팅방에서 칭찬 버튼을 누릅니다',
    description:
      '함께했던 파티원의 채팅방 또는 프로필에서 칭찬하기 버튼을 찾아 누릅니다.',
    icon: Heart,
  },
  {
    title: '칭찬 유형을 선택합니다',
    description:
      '친절해요, 응답이 빨라요, 책임감 있어요, 분위기가 좋아요, 직접 입력 중 하나를 선택합니다.',
    icon: Heart,
  },
  {
    title: '메시지를 입력합니다 (선택)',
    description:
      '칭찬 메시지를 직접 입력할 수 있습니다. 최대 120자까지 작성 가능하며, 입력하지 않아도 됩니다.',
    icon: Heart,
  },
  {
    title: '칭찬을 전송합니다',
    description:
      '전송하면 상대방의 신뢰도 점수가 +0.1점 오르며, 받은 칭찬 내역에 기록됩니다.',
    icon: Heart,
  },
];

const praiseTypes = [
  ['kind', '친절해요'],
  ['fast_response', '응답이 빨라요'],
  ['responsible', '책임감 있어요'],
  ['good_mood', '분위기가 좋아요'],
  ['custom', '직접 입력'],
];

export default function PraiseManualSection() {
  return (
    <ManualSection
      id="praise"
      number="06"
      title="칭찬하는 방법"
      description="함께한 파티원에게 칭찬을 보내면 상대방의 신뢰도 점수가 오릅니다. 칭찬 내역은 마이페이지에서 확인할 수 있습니다."
    >
      <InstructionSteps steps={praiseSteps} />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-black text-slate-950 mb-4">칭찬 유형</h3>
          <div className="grid gap-2">
            {praiseTypes.map(([, label]) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3"
              >
                <Heart className="h-4 w-4 shrink-0 text-pink-400" />
                <span className="text-sm font-bold text-slate-800">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="font-black text-slate-950">칭찬 제한 안내</h3>
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-950">재칭찬 제한</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                같은 상대에게는 30일에 1번만 칭찬할 수 있습니다.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-950">월 점수 상한</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                칭찬으로 받을 수 있는 신뢰도 점수는 월 최대 +2점입니다.
                어뷰징 방지를 위한 정책입니다.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-950">파티 관계 확인</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                함께 파티에 참여한 적 있는 사용자에게만 칭찬이 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <ManualCallout title="칭찬 내역 확인" variant="success">
          받은 칭찬과 보낸 칭찬은 마이페이지의 칭찬 내역 메뉴에서 확인할 수
          있습니다. 신뢰도 변화 내역에서도 칭찬으로 인한 점수 변동을 확인할 수
          있습니다.
        </ManualCallout>
      </div>
    </ManualSection>
  );
}
